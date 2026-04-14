from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from accounts.models import EmailNotificationLog
from notifications.models import Notification
from notifications.scheduler import dispatch_automated_emails
from tasks.models import Task

User = get_user_model()


class NotificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="teste",
            email="teste@email.com",
            password="123456",
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


class AutomatedEmailDispatchTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="samuel",
            email="samuel@email.com",
            password="123456",
            last_seen_at=timezone.now() - timedelta(minutes=30),
        )

    @patch("accounts.emailing.send_templated_email")
    def test_send_due_soon_email_only_for_offline_user(self, mocked_send):
        now = timezone.localtime().replace(hour=7, minute=0, second=0, microsecond=0)
        self.user.last_seen_at = now - timedelta(minutes=30)
        self.user.save(update_fields=["last_seen_at"])

        Task.objects.create(
            user=self.user,
            title="Entregar relatório",
            due_date=now + timedelta(minutes=90),
        )

        dispatch_automated_emails(reference_dt=now)

        self.assertTrue(
            EmailNotificationLog.objects.filter(
                user=self.user,
                email_type="task_due_soon",
            ).exists()
        )
        self.assertEqual(mocked_send.call_count, 1)

    @patch("accounts.emailing.send_templated_email")
    def test_do_not_send_due_soon_email_for_online_user(self, mocked_send):
        now = timezone.localtime().replace(hour=7, minute=0, second=0, microsecond=0)
        self.user.last_seen_at = now
        self.user.save(update_fields=["last_seen_at"])

        Task.objects.create(
            user=self.user,
            title="Responder atividade",
            due_date=now + timedelta(minutes=60),
        )

        dispatch_automated_emails(reference_dt=now)

        self.assertFalse(
            EmailNotificationLog.objects.filter(
                user=self.user,
                email_type="task_due_soon",
            ).exists()
        )
        self.assertEqual(mocked_send.call_count, 0)

    @patch("accounts.emailing.send_templated_email")
    def test_send_became_overdue_email(self, mocked_send):
        now = timezone.localtime().replace(hour=7, minute=0, second=0, microsecond=0)
        self.user.last_seen_at = now - timedelta(minutes=30)
        self.user.save(update_fields=["last_seen_at"])

        Task.objects.create(
            user=self.user,
            title="Atividade vencida agora",
            due_date=now - timedelta(minutes=5),
        )

        dispatch_automated_emails(reference_dt=now)

        self.assertTrue(
            EmailNotificationLog.objects.filter(
                user=self.user,
                email_type="task_became_overdue",
            ).exists()
        )
        self.assertEqual(mocked_send.call_count, 1)

    @patch("accounts.emailing.send_templated_email")
    def test_send_daily_pending_summary(self, mocked_send):
        now = timezone.localtime().replace(hour=9, minute=0, second=0, microsecond=0)
        self.user.last_seen_at = now - timedelta(minutes=30)
        self.user.save(update_fields=["last_seen_at"])

        Task.objects.create(
            user=self.user,
            title="Atividade atrasada",
            due_date=now - timedelta(days=1),
        )

        dispatch_automated_emails(reference_dt=now)

        self.assertTrue(
            EmailNotificationLog.objects.filter(
                user=self.user,
                email_type="pending_activity",
            ).exists()
        )
        self.assertGreaterEqual(mocked_send.call_count, 1)
