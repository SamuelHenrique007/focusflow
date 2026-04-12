from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from focusflow.focusflow_render.backend.notifications.models import Notification
from focusflow.focusflow_render.backend.notifications.services import notify_task_completed

User = get_user_model()

class NotificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="teste",
            email="teste@email.com",
            password="123456"
        )

    def test_create_notification(self):
        notification = Notification.objects.create(
            user=self.user,
            type="daily_goal_completed",
            title="Meta concluída",
            description="Você concluiu sua meta diária.",
            priority="low",
        )

        self.assertEqual(notification.user, self.user)
        self.assertFalse(notification.is_read)
        self.assertFalse(notification.is_deleted)