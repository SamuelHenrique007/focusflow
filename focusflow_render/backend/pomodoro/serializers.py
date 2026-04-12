from rest_framework import serializers
from tasks.models import Task

from .models import (
    PomodoroSetting,
    PomodoroSession
)


class PomodoroSettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = PomodoroSetting
        fields = [
            'focus_minutes',
            'short_break_minutes',
            'long_break_minutes',
            'cycles_before_long_break',
            'updated_at',
        ]

        read_only_fields = ['updated_at']

    def validate_focus_minutes(self, value):

        if value < 15 or value > 60:
            raise serializers.ValidationError(
                'O tempo de foco deve ficar entre 15 e 60 minutos.'
            )

        return value

    def validate_short_break_minutes(self, value):

        if value < 3 or value > 15:
            raise serializers.ValidationError(
                'A pausa curta deve ficar entre 3 e 15 minutos.'
            )

        return value

    def validate_long_break_minutes(self, value):

        if value < 10 or value > 30:
            raise serializers.ValidationError(
                'A pausa longa deve ficar entre 10 e 30 minutos.'
            )

        return value

    def validate_cycles_before_long_break(self, value):

        if value < 2 or value > 6:
            raise serializers.ValidationError(
                'Os ciclos devem ficar entre 2 e 6.'
            )

        return value


class PomodoroSessionSerializer(serializers.ModelSerializer):

    task_title = serializers.CharField(
        source='task.title',
        read_only=True
    )

    class Meta:
        model = PomodoroSession

        fields = [
            'id',
            'task',
            'task_title',
            'session_type',
            'planned_minutes',
            'started_at',
            'ended_at',
            'status',
            'earned_points'
        ]

        read_only_fields = [
            'id',
            'started_at',
            'ended_at',
            'status',
            'earned_points'
        ]


class StartSessionSerializer(serializers.Serializer):

    task_id = serializers.IntegerField(
        required=False,
        allow_null=True
    )

    session_type = serializers.ChoiceField(
        choices=['focus', 'short_break', 'long_break']
    )

    planned_minutes = serializers.IntegerField(
        min_value=1
    )

    def validate_task_id(self, value):

        if value is None:
            return value

        request = self.context['request']

        if not Task.objects.filter(
                id=value,
                user=request.user
        ).exists():

            raise serializers.ValidationError(
                'Tarefa não encontrada para este usuário.'
            )

        return value