from django.conf import settings
from django.db import models


class Task(models.Model):
    CATEGORY_CHOICES = [
        ("estudo", "Estudo"),
        ("trabalho", "Trabalho"),
        ("pessoal", "Pessoal"),
    ]

    PRIORITY_CHOICES = [
        ("alta", "Alta"),
        ("media", "Média"),
        ("baixa", "Baixa"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="estudo",
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="media",
    )

    due_date = models.DateTimeField(blank=True, null=True)

    pomodoro_estimated = models.PositiveIntegerField(default=1)
    pomodoro_completed = models.PositiveIntegerField(default=0)
    focus_minutes_completed = models.PositiveIntegerField(default=0)

    completed_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class TaskSubtask(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subtasks",
    )
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.title