from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


@override_settings(SECURE_SSL_REDIRECT=False)
class AccountsAPITests(APITestCase):
    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.me_url = "/api/auth/me/"
        self.change_password_url = "/api/auth/change-password/"

        self.user = User.objects.create_user(
            username="samuel@email.com",
            email="samuel@email.com",
            password="SenhaForte@123",
            name="Samuel",
        )

    def authenticate(self):
        response = self.client.post(
            self.login_url,
            {
                "email": "samuel@email.com",
                "password": "SenhaForte@123",
            },
            format="json",
        )
        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")