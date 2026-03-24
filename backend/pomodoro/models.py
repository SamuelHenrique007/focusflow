from django.conf import settings
from django.db import models
from django.utils import timezone


class PomodoroSession(models.Model):
    SESSION_TYPES = [
        ("focus", "Foco"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pomodoro_sessions",
    )
    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pomodoro_sessions",
    )
    type = models.CharField(max_length=20, choices=SESSION_TYPES, default="focus")
    duration_minutes = models.PositiveIntegerField()
    completed = models.BooleanField(default=True)
    date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.type} - {self.duration_minutes}min"