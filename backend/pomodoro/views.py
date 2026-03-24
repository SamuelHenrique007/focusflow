from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PomodoroSession
from accounts.models import UserStats
from tasks.models import Task


DEFAULT_POMODORO_SETTINGS = {
    "focus_duration": 25,
    "short_break": 5,
    "long_break": 15,
    "cycles_before_long_break": 4,
}


def get_or_create_user_stats(user):
    stats, created = UserStats.objects.get_or_create(
        user=user,
        defaults={
            "total_points": 0,
            "total_focus_minutes": 0,
            "total_pomodoros": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "last_active_date": None,
            "pomodoro_settings": DEFAULT_POMODORO_SETTINGS,
        },
    )

    if created:
        return stats

    needs_update = False

    if stats.pomodoro_settings is None:
        stats.pomodoro_settings = DEFAULT_POMODORO_SETTINGS.copy()
        needs_update = True
    else:
        merged = {**DEFAULT_POMODORO_SETTINGS, **stats.pomodoro_settings}
        if merged != stats.pomodoro_settings:
            stats.pomodoro_settings = merged
            needs_update = True

    if needs_update:
        stats.save(update_fields=["pomodoro_settings"])

    return stats


def validate_settings_payload(data, current_settings):
    def parse_positive_int(value, fallback, field_name):
        if value in [None, ""]:
            return fallback

        try:
            parsed = int(value)
        except (TypeError, ValueError):
            raise ValueError(f"O campo '{field_name}' deve ser um número inteiro.")

        if parsed < 1:
            raise ValueError(f"O campo '{field_name}' deve ser maior que zero.")

        return parsed

    return {
        "focus_duration": parse_positive_int(
            data.get("focus_duration"),
            current_settings["focus_duration"],
            "focus_duration",
        ),
        "short_break": parse_positive_int(
            data.get("short_break"),
            current_settings["short_break"],
            "short_break",
        ),
        "long_break": parse_positive_int(
            data.get("long_break"),
            current_settings["long_break"],
            "long_break",
        ),
        "cycles_before_long_break": parse_positive_int(
            data.get("cycles_before_long_break"),
            current_settings["cycles_before_long_break"],
            "cycles_before_long_break",
        ),
    }


class PomodoroSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = get_or_create_user_stats(request.user)
        return Response(stats.pomodoro_settings)

    def put(self, request):
        stats = get_or_create_user_stats(request.user)
        current = stats.pomodoro_settings

        try:
            updated = validate_settings_payload(request.data, current)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stats.pomodoro_settings = updated
        stats.save(update_fields=["pomodoro_settings"])

        return Response(updated)


class PomodoroStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = get_or_create_user_stats(request.user)

        return Response(
            {
                "total_points": stats.total_points,
                "total_focus_minutes": stats.total_focus_minutes,
                "total_pomodoros": stats.total_pomodoros,
                "current_streak": stats.current_streak,
                "longest_streak": stats.longest_streak,
                "last_active_date": stats.last_active_date,
                "pomodoro_settings": stats.pomodoro_settings,
            }
        )


class PomodoroTodayMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()

        sessions = PomodoroSession.objects.filter(
            user=request.user,
            type="focus",
            completed=True,
            date=today,
        )

        total_sessions = sessions.count()
        total_minutes = sum(session.duration_minutes for session in sessions)

        return Response(
            {
                "date": today,
                "total_sessions": total_sessions,
                "total_minutes": total_minutes,
            }
        )


class PomodoroCompleteFocusView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        stats = get_or_create_user_stats(user)
        settings = stats.pomodoro_settings

        task_id = request.data.get("task_id")
        duration_minutes = request.data.get(
            "duration_minutes",
            settings["focus_duration"],
        )

        try:
            duration_minutes = int(duration_minutes)
            if duration_minutes < 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response(
                {"detail": "duration_minutes deve ser um número inteiro maior que zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = None
        if task_id not in [None, ""]:
            try:
                task = Task.objects.get(id=task_id, user=user)
            except Task.DoesNotExist:
                return Response(
                    {"detail": "Tarefa não encontrada."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        session = PomodoroSession.objects.create(
            user=user,
            task=task,
            type="focus",
            duration_minutes=duration_minutes,
            completed=True,
            date=timezone.localdate(),
        )

        if task:
            task.pomodoro_completed = (task.pomodoro_completed or 0) + 1
            task.focus_minutes_completed = (task.focus_minutes_completed or 0) + duration_minutes
            task.save(update_fields=["pomodoro_completed", "focus_minutes_completed"])

        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        previous_date = stats.last_active_date

        stats.total_points += 10
        stats.total_focus_minutes += duration_minutes
        stats.total_pomodoros += 1

        if previous_date == today:
            pass
        elif previous_date == yesterday:
            stats.current_streak += 1
        else:
            stats.current_streak = 1

        stats.last_active_date = today
        stats.longest_streak = max(stats.longest_streak, stats.current_streak)
        stats.save()

        return Response(
            {
                "message": "Sessão de foco concluída com sucesso.",
                "session": {
                    "id": session.id,
                    "type": session.type,
                    "duration_minutes": session.duration_minutes,
                    "completed": session.completed,
                    "date": session.date,
                    "task_id": session.task_id,
                },
                "stats": {
                    "total_points": stats.total_points,
                    "total_focus_minutes": stats.total_focus_minutes,
                    "total_pomodoros": stats.total_pomodoros,
                    "current_streak": stats.current_streak,
                    "longest_streak": stats.longest_streak,
                    "last_active_date": stats.last_active_date,
                    "pomodoro_settings": stats.pomodoro_settings,
                },
            },
            status=status.HTTP_201_CREATED,
        )