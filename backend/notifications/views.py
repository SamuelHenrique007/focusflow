from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer
from .services import active_notifications_queryset, sync_user_notifications


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
    
        sync_user_notifications(request.user)

        notifications = active_notifications_queryset(request.user)
        serializer = NotificationSerializer(notifications, many=True)

        return Response(
            {
                "success": True,
                "items": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sync_user_notifications(request.user)

        count = active_notifications_queryset(request.user).filter(is_read=False).count()

        return Response(
            {
                "success": True,
                "count": count,
            },
            status=status.HTTP_200_OK,
        )


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        notification = get_object_or_404(
            Notification,
            id=notification_id,
            user=request.user,
            is_deleted=False,
        )
        notification.mark_as_read()

        return Response(
            {
                "success": True,
                "message": "Notificação marcada como lida.",
            },
            status=status.HTTP_200_OK,
        )


class MarkNotificationUnreadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        notification = get_object_or_404(
            Notification,
            id=notification_id,
            user=request.user,
            is_deleted=False,
        )
        notification.mark_as_unread()

        return Response(
            {
                "success": True,
                "message": "Notificação marcada como não lida.",
            },
            status=status.HTTP_200_OK,
        )


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        now = timezone.now()

        active_notifications_queryset(request.user).filter(
            is_read=False
        ).update(
            is_read=True,
            read_at=now,
            updated_at=now,
        )

        return Response(
            {
                "success": True,
                "message": "Todas as notificações foram marcadas como lidas.",
            },
            status=status.HTTP_200_OK,
        )


class DeleteNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):
        notification = get_object_or_404(
            Notification,
            id=notification_id,
            user=request.user,
            is_deleted=False,
        )
        notification.soft_delete()

        return Response(
            {
                "success": True,
                "message": "Notificação removida com sucesso.",
            },
            status=status.HTTP_200_OK,
        )


class ClearReadNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        now = timezone.now()

        active_notifications_queryset(request.user).filter(
            is_read=True
        ).update(
            is_deleted=True,
            deleted_at=now,
            updated_at=now,
        )

        return Response(
            {
                "success": True,
                "message": "Notificações lidas removidas com sucesso.",
            },
            status=status.HTTP_200_OK,
        )