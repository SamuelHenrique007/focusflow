from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class EmailNotificationLog(models.Model):
    EMAIL_TYPE_CHOICES = [
        ("welcome_account", "Cadastro confirmado"),
        ("pending_activity", "Atividade pendente"),
        ("streak_warning", "Sequência em risco"),
        ("productivity_summary", "Resumo periódico de produtividade"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_notification_logs",
    )
    email_type = models.CharField(max_length=50, choices=EMAIL_TYPE_CHOICES)
    reference_key = models.CharField(max_length=120)
    metadata = models.JSONField(default=dict, blank=True)
    last_sent_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_sent_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "email_type", "reference_key"],
                name="unique_email_notification_per_reference",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.email_type} - {self.reference_key}"
