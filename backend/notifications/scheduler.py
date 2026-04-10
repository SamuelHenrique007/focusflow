from apscheduler.schedulers.background import BackgroundScheduler
from django.contrib.auth import get_user_model
from django.utils import timezone

from .services import sync_user_notifications

scheduler = BackgroundScheduler(timezone=str(timezone.get_current_timezone()))


def sync_all_users_notifications():
    User = get_user_model()

    for user in User.objects.filter(is_active=True):
        sync_user_notifications(user)


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            sync_all_users_notifications,
            "interval",
            seconds=10,
            id="notifications_sync_job",
            replace_existing=True,
        )

        scheduler.start()