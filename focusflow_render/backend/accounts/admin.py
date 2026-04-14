from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import EmailNotificationLog, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("email", "name", "is_staff", "is_active", "date_created")
    ordering = ("email",)
    fieldsets = UserAdmin.fieldsets + (
        ("Informações adicionais", {"fields": ("name", "date_created")}),
    )
    readonly_fields = ("date_created",)


@admin.register(EmailNotificationLog)
class EmailNotificationLogAdmin(admin.ModelAdmin):
    list_display = ("user", "email_type", "reference_key", "last_sent_at")
    list_filter = ("email_type", "last_sent_at")
    search_fields = ("user__email", "reference_key")
    readonly_fields = ("user", "email_type", "reference_key", "metadata", "created_at", "last_sent_at")
