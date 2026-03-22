from rest_framework import serializers
from .models import Task, TaskSubtask


class TaskSubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSubtask
        fields = ["id", "title"]


class TaskSerializer(serializers.ModelSerializer):
    subtasks = TaskSubtaskSerializer(many=True, required=False)
    due_label = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "due_date",
            "due_label",
            "pomodoro_total",
            "pomodoro_done",
            "progress",
            "subtasks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "due_label",
            "progress",
            "created_at",
            "updated_at",
        ]

    def get_due_label(self, obj):
        if not obj.due_date:
            return "Sem prazo"
        return obj.due_date.strftime("%d/%m/%Y %H:%M")

    def get_progress(self, obj):
        if obj.pomodoro_total <= 0:
            return 0
        value = obj.pomodoro_done / obj.pomodoro_total
        return min(max(value, 0), 1)

    def create(self, validated_data):
        subtasks_data = validated_data.pop("subtasks", [])
        task = Task.objects.create(**validated_data)

        for subtask in subtasks_data:
            TaskSubtask.objects.create(task=task, **subtask)

        return task

    def update(self, instance, validated_data):
        subtasks_data = validated_data.pop("subtasks", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if subtasks_data is not None:
            instance.subtasks.all().delete()
            for subtask in subtasks_data:
                TaskSubtask.objects.create(task=instance, **subtask)

        return instance