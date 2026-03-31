from django.db import transaction

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from gamification.models import UserProfile
from gamification.views import apply_level_up
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Task.objects.filter(user=self.request.user)
            .prefetch_related("subtasks")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        task_before = self.get_object()

        was_completed = task_before.completed_at is not None
        reward_already_granted = task_before.reward_granted

        task = serializer.save()

        is_completed_now = task.completed_at is not None

        if not was_completed and is_completed_now and not reward_already_granted:
            profile, _ = UserProfile.objects.get_or_create(user=task.user)

            xp_reward = 15
            coins_reward = 10

            profile.total_tasks_completed += 1
            profile.current_xp += xp_reward
            profile.coins += coins_reward

            apply_level_up(profile)
            profile.save()

            task.reward_granted = True
            task.save(update_fields=["reward_granted"])