from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_emailnotificationlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="last_seen_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name="emailnotificationlog",
            name="email_type",
            field=models.CharField(
                max_length=50,
                choices=[
                    ("welcome_account", "Cadastro confirmado"),
                    ("pending_activity", "Atividade pendente"),
                    ("task_due_soon", "Atividade prestes a vencer"),
                    ("task_became_overdue", "Atividade ficou pendente"),
                    ("streak_warning", "Sequência em risco"),
                    ("productivity_summary", "Resumo periódico de produtividade"),
                ],
            ),
        ),
    ]
