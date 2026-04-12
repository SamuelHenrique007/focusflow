from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gamification", "0005_userprofile_today_focus_minutes"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="daily_challenge_state",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
