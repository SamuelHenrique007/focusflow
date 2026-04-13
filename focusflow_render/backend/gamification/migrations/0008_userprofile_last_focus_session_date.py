from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gamification", "0007_add_more_theme_items"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="last_focus_session_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
