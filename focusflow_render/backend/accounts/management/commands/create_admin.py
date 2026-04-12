from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = "Cria superusuário automaticamente se não existir"

    def handle(self, *args, **kwargs):
        User = get_user_model()

        email = os.getenv("SUPERUSER_EMAIL")
        password = os.getenv("SUPERUSER_PASSWORD")

        if not email or not password:
            return

        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                username=email,
                email=email,
                password=password,
                name="Administrador",
            )
            self.stdout.write("Superusuário criado com sucesso.")