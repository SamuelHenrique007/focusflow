from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.emailing import maybe_send_task_event_emails

from .models import Task


@receiver(post_save, sender=Task)
def send_task_email_on_relevant_change(sender, instance, **kwargs):
    maybe_send_task_event_emails(instance)
