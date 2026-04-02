from django.urls import path
from .views import (
    NotificationListView,
    UnreadNotificationCountView,
    MarkNotificationReadView,
    MarkNotificationUnreadView,
    MarkAllNotificationsReadView,
    DeleteNotificationView,
    ClearReadNotificationsView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification_list"),
    path("unread-count/", UnreadNotificationCountView.as_view(), name="notification_unread_count"),
    path("<int:notification_id>/read/", MarkNotificationReadView.as_view(), name="notification_mark_read"),
    path("<int:notification_id>/unread/", MarkNotificationUnreadView.as_view(), name="notification_mark_unread"),
    path("mark-all-read/", MarkAllNotificationsReadView.as_view(), name="notification_mark_all_read"),
    path("<int:notification_id>/", DeleteNotificationView.as_view(), name="notification_delete"),
    path("clear-read/", ClearReadNotificationsView.as_view(), name="notification_clear_read"),
]