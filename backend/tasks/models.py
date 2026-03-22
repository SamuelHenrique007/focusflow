from django.conf import settings
from django.db import models


class Task(models.Model):
    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("em_progresso", "Em progresso"),
        ("concluida", "Concluída"),
    ]

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

    # ✅ corrigido aqui
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="estudo"
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="media"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pendente"
    )

    due_date = models.DateTimeField(blank=True, null=True)

    pomodoro_total = models.PositiveIntegerField(default=1)
    pomodoro_done = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TaskSubtask(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subtasks",
    )

    title = models.CharField(max_length=255)

    def __str__(self):
        return self.title