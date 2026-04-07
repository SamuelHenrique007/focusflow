from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import Notification


def get_notifications_group_name(user_id: int) -> str:
    return f"notifications_user_{user_id}"


def build_notifications_snapshot(user):
    now = timezone.now()
    queryset = Notification.objects.filter(user=user, is_deleted=False).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=now)
    )
    unread_count = queryset.filter(is_read=False).count()
    total_count = queryset.count()

    return {
        "unreadCount": unread_count,
        "totalCount": total_count,
        "hasUnreadNotifications": unread_count > 0,
    }


def broadcast_notifications_state(user, *, event_type: str = "notifications.updated", notification_id=None):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    payload = {
        "type": event_type,
        **build_notifications_snapshot(user),
    }

    if notification_id is not None:
        payload["notificationId"] = notification_id

    group_name = get_notifications_group_name(user.id)

    def _broadcast():
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "notifications.event",
                "payload": payload,
            },
        )

    transaction.on_commit(_broadcast)
