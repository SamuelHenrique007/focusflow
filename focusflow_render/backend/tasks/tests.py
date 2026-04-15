from django.test import override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import Task

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class TaskAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="samuel@email.com",
            email="samuel@email.com",
            password="SenhaForte@123",
            name="Samuel",
        )
        self.other_user = User.objects.create_user(
            username="outro@email.com",
            email="outro@email.com",
            password="SenhaForte@123",
            name="Outro",
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

        self.list_create_url = "/api/tasks/"

    def test_create_task(self):
        response = self.client.post(
            self.list_create_url,
            {
                "title": "Estudar Django",
                "description": "Revisar serializers",
                "category": "estudo",
                "priority": "alta",
                "pomodoroEstimated": 3,
                "dueDate": (timezone.now() + timezone.timedelta(days=1)).isoformat(),
                "subtasks": [
                    {"title": "Ler models", "isCompleted": False},
                    {"title": "Testar endpoints", "isCompleted": False},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.filter(user=self.user).count(), 1)

        task = Task.objects.get(user=self.user)
        self.assertEqual(task.title, "Estudar Django")
        self.assertEqual(task.subtasks.count(), 2)

    def test_list_only_logged_user_tasks(self):
        Task.objects.create(user=self.user, title="Minha tarefa")
        Task.objects.create(user=self.other_user, title="Tarefa do outro")

        response = self.client.get(self.list_create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Minha tarefa")

    def test_update_task(self):
        task = Task.objects.create(
            user=self.user,
            title="Tarefa antiga",
            priority="media",
        )

        response = self.client.patch(
            f"/api/tasks/{task.id}/",
            {
                "title": "Tarefa atualizada",
                "priority": "alta",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        task.refresh_from_db()
        self.assertEqual(task.title, "Tarefa atualizada")
        self.assertEqual(task.priority, "alta")

    def test_delete_task(self):
        task = Task.objects.create(user=self.user, title="Excluir tarefa")

        response = self.client.delete(f"/api/tasks/{task.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())