from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Notification(models.Model):
    TYPE_CHOICES = [
        ("task_overdue", "Tarefa atrasada"),
        ("task_due_today", "Tarefa vence hoje"),
        ("daily_goal_completed", "Meta diária concluída"),
        ("chest_ready", "Baú disponível"),
        ("focus_coins_ready", "Minutos prontos para conversão"),
        ("level_up", "Subida de nível"),
        ("streak_warning", "Sequência em risco"),
        ("no_focus_today", "Sem foco hoje"),
        ("good_progress_today", "Bom progresso diário"),
        ("streak_congrats", "Sequência mantida"),
        ("task_completed", "Tarefa concluída"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Baixa"),
        ("medium", "Média"),
        ("high", "Alta"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="low")

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)

    unique_key = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    expires_at = models.DateTimeField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "unique_key"],
                condition=Q(unique_key__isnull=False),
                name="unique_notification_per_user_key",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at", "updated_at"])

    def mark_as_unread(self):
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=["is_read", "read_at", "updated_at"])

    def soft_delete(self):
        if not self.is_deleted:
            self.is_deleted = True
            self.deleted_at = timezone.now()
            self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])