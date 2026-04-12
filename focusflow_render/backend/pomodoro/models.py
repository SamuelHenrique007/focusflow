from django.conf import settings
from django.db import models
from tasks.models import Task


class PomodoroSetting(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pomodoro_setting'
    )

    focus_minutes = models.PositiveIntegerField(default=25)
    short_break_minutes = models.PositiveIntegerField(default=5)
    long_break_minutes = models.PositiveIntegerField(default=15)
    cycles_before_long_break = models.PositiveIntegerField(default=4)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Configurações Pomodoro de {self.user.username}'


class PomodoroSession(models.Model):

    SESSION_TYPE_CHOICES = [
        ('focus', 'Focus'),
        ('short_break', 'Short Break'),
        ('long_break', 'Long Break'),
    ]

    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pomodoro_sessions'
    )

    task = models.ForeignKey(
        Task,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pomodoro_sessions'
    )

    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default='focus'
    )

    planned_minutes = models.PositiveIntegerField()

    started_at = models.DateTimeField(auto_now_add=True)

    ended_at = models.DateTimeField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='running'
    )

    earned_points = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.user.username} - {self.session_type} - {self.status}'