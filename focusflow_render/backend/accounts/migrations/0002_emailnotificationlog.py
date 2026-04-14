from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailNotificationLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "email_type",
                    models.CharField(
                        choices=[
                            ("welcome_account", "Cadastro confirmado"),
                            ("pending_activity", "Atividade pendente"),
                            ("streak_warning", "Sequência em risco"),
                            ("productivity_summary", "Resumo periódico de produtividade"),
                        ],
                        max_length=50,
                    ),
                ),
                ("reference_key", models.CharField(max_length=120)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("last_sent_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="email_notification_logs",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "ordering": ["-last_sent_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="emailnotificationlog",
            constraint=models.UniqueConstraint(
                fields=("user", "email_type", "reference_key"),
                name="unique_email_notification_per_reference",
            ),
        ),
    ]
