from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    isRead = serializers.BooleanField(source="is_read", read_only=True)
    readAt = serializers.DateTimeField(source="read_at", read_only=True, allow_null=True)
    expiresAt = serializers.DateTimeField(source="expires_at", read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "description",
            "priority",
            "isRead",
            "readAt",
            "createdAt",
            "updatedAt",
            "expiresAt",
            "metadata",
        ]