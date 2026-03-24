from rest_framework import serializers
from .models import PomodoroSession
from accounts.models import UserStats


class PomodoroSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = [
            "id",
            "user",
            "task",
            "type",
            "duration_minutes",
            "completed",
            "date",
            "created_at",
        ]
        read_only_fields = ["id", "user", "date", "created_at"]


class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStats
        fields = [
            "total_points",
            "total_focus_minutes",
            "total_pomodoros",
            "current_streak",
            "longest_streak",
            "last_active_date",
            "pomodoro_settings",
        ]