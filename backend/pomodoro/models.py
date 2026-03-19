from django.conf import settings
from django.db import models


class Pomodoro(models.Model):
    STATUS_CHOICES = [
        ("started", "Iniciado"),
        ("paused", "Pausado"),
        ("finished", "Finalizado"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pomodoros"
    )
    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pomodoros"
    )
    focus_time = models.PositiveIntegerField(help_text="Tempo de foco em minutos")
    break_time = models.PositiveIntegerField(help_text="Tempo de pausa em minutos")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="started"
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Pomodoro #{self.id} - {self.user.email}"