from django.urls import path
from .views import (
    MyPomodoroSettingView,
    StartPomodoroSessionView,
    FinishPomodoroSessionView,
    PomodoroStatsView,
    SessionHistoryView,
)

urlpatterns = [
    path('settings/me/', MyPomodoroSettingView.as_view(), name='pomodoro-settings-me'),
    path('sessions/start/', StartPomodoroSessionView.as_view(), name='pomodoro-session-start'),
    path('sessions/<int:session_id>/finish/', FinishPomodoroSessionView.as_view(), name='pomodoro-session-finish'),
    path('sessions/history/', SessionHistoryView.as_view(), name='pomodoro-session-history'),
    path('stats/', PomodoroStatsView.as_view(), name='pomodoro-stats'),
]