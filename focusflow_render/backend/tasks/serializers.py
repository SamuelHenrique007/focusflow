from django.utils import timezone
from rest_framework import serializers
from .models import Task, TaskSubtask

class TaskSubtaskSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(required=False)
    isCompleted = serializers.BooleanField(source="is_completed", default=False)

    class Meta:
        model = TaskSubtask
        fields = ["id", "title", "isCompleted"]


class TaskSerializer(serializers.ModelSerializer):
    subtasks = TaskSubtaskSerializer(many=True, required=False)
    
    dueDate = serializers.DateTimeField(source="due_date", required=False, allow_null=True)
    pomodoroEstimated = serializers.IntegerField(source="pomodoro_estimated", default=1)
    pomodoroCompleted = serializers.IntegerField(source="pomodoro_completed", default=0)
    focusMinutesCompleted = serializers.IntegerField(source="focus_minutes_completed", default=0)
    completedAt = serializers.DateTimeField(source="completed_at", required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    
    status = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    dueLabel = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "progress",
            "dueLabel",
            "dueDate",
            "pomodoroEstimated",
            "pomodoroCompleted",
            "focusMinutesCompleted",
            "completedAt",
            "createdAt",
            "updatedAt",
            "subtasks",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt", "status", "progress", "dueLabel"]

    def get_status(self, obj):
        now = timezone.now()

        if obj.completed_at:
            return "concluida"
        
        if obj.due_date and obj.due_date < now:
            return "pendente"
        
        
        return "em_andamento"

    def get_progress(self, obj):
       
        if not obj.pomodoro_estimated or obj.pomodoro_estimated <= 0:
            return 0
        
        progresso = (obj.pomodoro_completed / obj.pomodoro_estimated) * 100
        return round(min(progresso, 100), 1)

    def get_dueLabel(self, obj):
        
        if not obj.due_date:
            return "Sem prazo"

        local_due_date = timezone.localtime(obj.due_date)
        return local_due_date.strftime("%d/%m/%Y %H:%M")

    def validate(self, attrs):
        
        instance = getattr(self, "instance", None)
        
        estimated = attrs.get("pomodoro_estimated", instance.pomodoro_estimated if instance else 1)
        completed = attrs.get("pomodoro_completed", instance.pomodoro_completed if instance else 0)

        if estimated < 1:
            raise serializers.ValidationError({"pomodoroEstimated": "A estimativa mínima é 1."})
        if completed < 0:
            raise serializers.ValidationError({"pomodoroCompleted": "Os pomodoros concluídos não podem ser negativos."})

        return attrs

    def to_internal_value(self, data):
   
        mutable_data = data.copy()
        for field in ["completedAt", "dueDate"]:
            if field in mutable_data and mutable_data[field] == "":
                mutable_data[field] = None
        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
       
        subtasks_data = validated_data.pop("subtasks", [])
        
        task = Task.objects.create(**validated_data)

        for sub_item in subtasks_data:
            TaskSubtask.objects.create(task=task, **sub_item)

        return task

    def update(self, instance, validated_data):
        
        subtasks_data = validated_data.pop("subtasks", None)
        
       
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if subtasks_data is not None:
            existing_subtasks = {s.id: s for s in instance.subtasks.all()}
            kept_ids = []

            for sub_item in subtasks_data:
                sub_id = sub_item.get("id")
                
                if sub_id and sub_id in existing_subtasks:
                    
                    subtask = existing_subtasks[sub_id]
                    subtask.title = sub_item.get("title", subtask.title)
                    subtask.is_completed = sub_item.get("is_completed", subtask.is_completed)
                    subtask.save()
                    kept_ids.append(sub_id)
                else:
                    
                    new_sub = TaskSubtask.objects.create(
                        task=instance,
                        title=sub_item["title"],
                        is_completed=sub_item.get("is_completed", False)
                    )
                    kept_ids.append(new_sub.id)

            
            instance.subtasks.exclude(id__in=kept_ids).delete()

        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["completedAt"] = (
            timezone.localtime(instance.completed_at).isoformat()
            if instance.completed_at
            else None
        )
        rep["dueDate"] = (
            timezone.localtime(instance.due_date).isoformat()
            if instance.due_date
            else None
        )
        return rep