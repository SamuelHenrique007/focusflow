from django.core.management.base import BaseCommand

from notifications.scheduler import dispatch_automated_emails


class Command(BaseCommand):
    help = "Dispara manualmente os e-mails automáticos do FocusFlow."

    def handle(self, *args, **options):
        dispatch_automated_emails()
        self.stdout.write(self.style.SUCCESS("Processamento de e-mails automáticos concluído."))
