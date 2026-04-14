from django.db import transaction

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from notifications.services import notify_task_completed, sync_user_notifications

from gamification.services import get_profile, reward_completed_task
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)

        if self.request.query_params.get("active_only") == "true":
            queryset = queryset.filter(completed_at__isnull=True)

        return queryset.prefetch_related("subtasks").order_by("-created_at")

    def perform_create(self, serializer):
        task = serializer.save(user=self.request.user)
        sync_user_notifications(task.user)

    @transaction.atomic
    def perform_update(self, serializer):
        task_before = self.get_object()

        was_completed = task_before.completed_at is not None
        reward_already_granted = task_before.reward_granted

        task = serializer.save()

        is_completed_now = task.completed_at is not None

        if not was_completed and is_completed_now and not reward_already_granted:
            profile = get_profile(task.user)
            reward_completed_task(profile)

            notify_task_completed(task)

            task.reward_granted = True
            task.save(update_fields=["reward_granted"])

        sync_user_notifications(task.user)

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        sync_user_notifications(user)