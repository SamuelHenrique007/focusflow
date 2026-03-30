from django.utils import timezone
from django.db.models import F,Sum
from django.db.models.functions import TruncDate
from django.db import transaction

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from gamification.models import UserProfile
from tasks.models import Task
from .models import PomodoroSetting, PomodoroSession
from .serializers import (
    PomodoroSettingSerializer,
    PomodoroSessionSerializer,
    StartSessionSerializer,
)


class MyPomodoroSettingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        setting, _ = PomodoroSetting.objects.get_or_create(user=request.user)
        serializer = PomodoroSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        setting, _ = PomodoroSetting.objects.get_or_create(user=request.user)
        serializer = PomodoroSettingSerializer(setting, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        setting, _ = PomodoroSetting.objects.get_or_create(user=request.user)
        serializer = PomodoroSettingSerializer(
            setting,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class StartPomodoroSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartSessionSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        task = None
        task_id = serializer.validated_data.get('task_id')

        if task_id:
            task = Task.objects.get(id=task_id, user=request.user)

        session = PomodoroSession.objects.create(
            user=request.user,
            task=task,
            session_type=serializer.validated_data['session_type'],
            planned_minutes=serializer.validated_data['planned_minutes'],
            status='running'
        )

        return Response(
            PomodoroSessionSerializer(session).data,
            status=status.HTTP_201_CREATED
        )


class FinishPomodoroSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = PomodoroSession.objects.get(
                id=session_id,
                user=request.user
            )
        except PomodoroSession.DoesNotExist:
            return Response(
                {'detail': 'Sessão não encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != 'running':
            return Response(
                {'detail': 'Esta sessão já foi finalizada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        completed = request.data.get('completed', True)
        session.ended_at = timezone.now()

        with transaction.atomic():
            if completed:
                session.status = 'completed'
                session.earned_points = 25 if session.session_type == 'focus' else 5

                if session.task and session.session_type == 'focus':
                    if hasattr(session.task, 'pomodoro_completed'):
                        session.task.pomodoro_completed = F('pomodoro_completed') + 1

                    if hasattr(session.task, 'focus_minutes_completed'):
                        session.task.focus_minutes_completed = (
                            F('focus_minutes_completed') + session.planned_minutes
                        )

                    session.task.save()
                    session.task.refresh_from_db()

                if session.session_type == 'focus':
                    profile, _ = UserProfile.objects.get_or_create(user=request.user)

                    profile.pending_focus_minutes = (
                        (profile.pending_focus_minutes or 0) + session.planned_minutes
                    )
                    profile.today_focus_minutes = (
                        (profile.today_focus_minutes or 0) + session.planned_minutes
                    )
                    profile.total_focus_minutes = (
                        (profile.total_focus_minutes or 0) + session.planned_minutes
                    )
                    profile.total_pomodoros = (
                        (profile.total_pomodoros or 0) + 1
                    )

                    profile.save()

            else:
                session.status = 'skipped'
                session.earned_points = 0

            session.save()

        return Response(PomodoroSessionSerializer(session).data)

from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class PomodoroStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        completed_focus_sessions_today = PomodoroSession.objects.filter(
            user=request.user,
            session_type='focus',
            status='completed',
            ended_at__date=today  
        )

        total_pomodoros = completed_focus_sessions_today.count()

        total_minutes = completed_focus_sessions_today.aggregate(
            total=Sum('planned_minutes')
        )['total'] or 0

        total_points = PomodoroSession.objects.filter(
            user=request.user,
            ended_at__date=today  
        ).aggregate(
            total=Sum('earned_points')
        )['total'] or 0

        active_days = (
            PomodoroSession.objects.filter(
                user=request.user,
                session_type='focus',
                status='completed',
                ended_at__isnull=False
            )
            .annotate(day=TruncDate('ended_at'))
            .values('day')
            .distinct()
            .count()
        )

        running_session = PomodoroSession.objects.filter(
            user=request.user,
            status='running'
        ).order_by('-started_at').first()

        return Response({
            'pomodoros': total_pomodoros,
            'minutes': total_minutes,
            'points': total_points,
            'active_days': active_days,
            'running_session': (
                PomodoroSessionSerializer(running_session).data
                if running_session else None
            )
        })

class SessionHistoryView(generics.ListAPIView):
    serializer_class = PomodoroSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PomodoroSession.objects.filter(
            user=self.request.user
        ).select_related('task').order_by('-started_at')