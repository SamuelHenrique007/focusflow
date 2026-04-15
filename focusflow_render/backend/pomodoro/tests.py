from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from pomodoro.models import PomodoroSession, PomodoroSetting
from tasks.models import Task
from django.test import override_settings

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class PomodoroAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="samuel@email.com",
            email="samuel@email.com",
            password="SenhaForte@123",
            name="Samuel",
        )

        login_response = self.client.post(
            "/api/auth/login/",
            {
                "email": "samuel@email.com",
                "password": "SenhaForte@123",
            },
            format="json",
        )
        token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        self.task = Task.objects.create(
            user=self.user,
            title="Tarefa com pomodoro",
            pomodoro_estimated=4,
        )

    def test_get_or_create_my_pomodoro_settings(self):
        response = self.client.get("/api/pomodoro/settings/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(PomodoroSetting.objects.filter(user=self.user).exists())

    def test_update_my_pomodoro_settings(self):
        response = self.client.put(
            "/api/pomodoro/settings/me/",
            {
                "focus_minutes": 30,
                "short_break_minutes": 5,
                "long_break_minutes": 15,
                "cycles_before_long_break": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        setting = PomodoroSetting.objects.get(user=self.user)
        self.assertEqual(setting.focus_minutes, 30)

    def test_start_pomodoro_session(self):
        response = self.client.post(
            "/api/pomodoro/sessions/start/",
            {
                "task_id": self.task.id,
                "session_type": "focus",
                "planned_minutes": 25,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PomodoroSession.objects.filter(user=self.user).count(), 1)

        session = PomodoroSession.objects.get(user=self.user)
        self.assertEqual(session.status, "running")
        self.assertEqual(session.task, self.task)

    def test_finish_completed_focus_session_updates_task(self):
        session = PomodoroSession.objects.create(
            user=self.user,
            task=self.task,
            session_type="focus",
            planned_minutes=25,
            status="running",
        )

        response = self.client.post(
            f"/api/pomodoro/sessions/{session.id}/finish/",
            {"completed": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        session.refresh_from_db()
        self.task.refresh_from_db()

        self.assertEqual(session.status, "completed")
        self.assertEqual(session.earned_points, 25)
        self.assertEqual(self.task.pomodoro_completed, 1)
        self.assertEqual(self.task.focus_minutes_completed, 25)

    def test_finish_skipped_session(self):
        session = PomodoroSession.objects.create(
            user=self.user,
            task=self.task,
            session_type="focus",
            planned_minutes=25,
            status="running",
        )

        response = self.client.post(
            f"/api/pomodoro/sessions/{session.id}/finish/",
            {"completed": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        session.refresh_from_db()
        self.assertEqual(session.status, "skipped")
        self.assertEqual(session.earned_points, 0)