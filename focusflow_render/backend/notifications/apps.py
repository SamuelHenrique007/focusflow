import os
import sys

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        should_run_scheduler = os.getenv("RUN_NOTIFICATION_SCHEDULER", "False").lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

        if not should_run_scheduler or "migrate" in sys.argv or "collectstatic" in sys.argv:
            return

        from .scheduler import start_scheduler

        start_scheduler()
