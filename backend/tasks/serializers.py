from django.utils import timezone
from rest_framework import serializers
from .models import Task, TaskSubtask


class TaskSubtaskSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    isCompleted = serializers.BooleanField(source="is_completed", required=False)

    class Meta:
        model = TaskSubtask
        fields = ["id", "title", "isCompleted"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("O título da subtarefa não pode ficar vazio.")
        return value


class TaskSerializer(serializers.ModelSerializer):
    subtasks = TaskSubtaskSerializer(many=True, required=False)

    dueDate = serializers.DateTimeField(source="due_date", required=False, allow_null=True)
    dueLabel = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    pomodoroEstimated = serializers.IntegerField(source="pomodoro_estimated", required=False)
    pomodoroCompleted = serializers.IntegerField(source="pomodoro_completed", required=False)

    completedAt = serializers.DateTimeField(source="completed_at", required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    status = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "dueDate",
            "dueLabel",
            "pomodoroEstimated",
            "pomodoroCompleted",
            "progress",
            "completedAt",
            "subtasks",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "status",
            "dueLabel",
            "progress",
            "createdAt",
            "updatedAt",
        ]

    def get_status(self, obj):
        if obj.completed_at:
            return "concluida"

        if obj.due_date and obj.due_date < timezone.now():
            return "pendente"

        return "em_progresso"

    def get_dueLabel(self, obj):
        if not obj.due_date:
            return "Sem prazo"

        if obj.completed_at:
            return "Concluída"

        if obj.due_date < timezone.now():
            return "Atrasada"

        return obj.due_date.strftime("%d/%m/%Y %H:%M")

    def get_progress(self, obj):
        total = obj.subtasks.count()
        if total == 0:
            return 0

        done = obj.subtasks.filter(is_completed=True).count()
        value = (done / total) * 100
        return min(max(round(value), 0), 100)

    def create(self, validated_data):
        subtasks_data = validated_data.pop("subtasks", [])
        task = Task.objects.create(**validated_data)

        for subtask_data in subtasks_data:
            TaskSubtask.objects.create(task=task, **subtask_data)

        return task

    def update(self, instance, validated_data):
        subtasks_data = validated_data.pop("subtasks", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if subtasks_data is not None:
            existing_subtasks = {subtask.id: subtask for subtask in instance.subtasks.all()}
            received_ids = []

            for subtask_data in subtasks_data:
                subtask_id = subtask_data.get("id")

                if subtask_id and subtask_id in existing_subtasks:
                    subtask = existing_subtasks[subtask_id]
                    subtask.title = subtask_data.get("title", subtask.title)
                    subtask.is_completed = subtask_data.get("is_completed", subtask.is_completed)
                    subtask.save()
                    received_ids.append(subtask_id)
                else:
                    new_subtask = TaskSubtask.objects.create(
                        task=instance,
                        title=subtask_data["title"],
                        is_completed=subtask_data.get("is_completed", False),
                    )
                    received_ids.append(new_subtask.id)

            for subtask_id, subtask in existing_subtasks.items():
                if subtask_id not in received_ids:
                    subtask.delete()

        return instance

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("O título da tarefa não pode ficar vazio.")
        return value

    def validate_pomodoroEstimated(self, value):
        if value < 0:
            raise serializers.ValidationError("pomodoroEstimated não pode ser negativo.")
        return value

    def validate_pomodoroCompleted(self, value):
        if value < 0:
            raise serializers.ValidationError("pomodoroCompleted não pode ser negativo.")
        return value

    def validate(self, attrs):
        estimated = attrs.get("pomodoro_estimated")
        completed = attrs.get("pomodoro_completed")

        if self.instance:
            if estimated is None:
                estimated = self.instance.pomodoro_estimated
            if completed is None:
                completed = self.instance.pomodoro_completed

        if estimated is not None and completed is not None and completed > estimated:
            raise serializers.ValidationError(
                {"pomodoroCompleted": "pomodoroCompleted não pode ser maior que pomodoroEstimated."}
            )

        return attrs