from django.contrib import admin

from .models import PomodoroSession


@admin.register(PomodoroSession)
class PomodoroSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "type",
        "duration_minutes",
        "completed",
        "date",
        "task",
        "created_at",
    )
    list_filter = ("type", "completed", "date")
    search_fields = ("user__username", "user__email", "task__title")