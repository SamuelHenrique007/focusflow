from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from notifications.models import Notification

User = get_user_model()


@override_settings(SECURE_SSL_REDIRECT=False)
class NotificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="api@email.com",
            email="api@email.com",
            password="SenhaForte@123",
        )

        login_response = self.client.post(
            "/api/auth/login/",
            {
                "email": "api@email.com",
                "password": "SenhaForte@123",
            },
            format="json",
            secure=True,
        )

        token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        self.notification = Notification.objects.create(
            user=self.user,
            type="task_due_today",
            title="Tarefa vence hoje",
            description="Finalize sua atividade.",
            priority="medium",
        )