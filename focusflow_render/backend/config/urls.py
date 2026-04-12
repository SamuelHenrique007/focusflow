from django.contrib import admin
from django.urls import include, path

from focusflow.focusflow_render.backend.core.views import health_check

urlpatterns = [
    path("", health_check, name="health-check"),
    path("health/", health_check, name="health-check-alt"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/pomodoro/", include("pomodoro.urls")),
    path("api/gamification/", include("gamification.urls")),
    path("api/notifications/", include("notifications.urls")),
]
