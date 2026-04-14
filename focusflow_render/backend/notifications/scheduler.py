from apscheduler.schedulers.background import BackgroundScheduler
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.emailing import (
    EMAIL_TYPE_PENDING_ACTIVITY,
    EMAIL_TYPE_PRODUCTIVITY_SUMMARY,
    EMAIL_TYPE_STREAK_WARNING,
    EMAIL_TYPE_TASK_BECAME_OVERDUE,
    EMAIL_TYPE_TASK_DUE_SOON,
    build_weekly_productivity_summary,
    get_pending_tasks_for_email,
    get_tasks_became_overdue_for_email,
    get_tasks_due_soon_for_email,
    is_user_offline,
    safe_send_email,
    send_became_overdue_email,
    send_due_soon_email,
    send_pending_activity_email,
    send_productivity_summary_email,
    send_streak_warning_email,
)
from gamification.services import get_profile

from .services import sync_user_notifications

scheduler = BackgroundScheduler(timezone=str(timezone.get_current_timezone()))


def sync_all_users_notifications():
    User = get_user_model()

    for user in User.objects.filter(is_active=True):
        sync_user_notifications(user)


def dispatch_automated_emails(reference_dt=None):
    User = get_user_model()
    now = reference_dt or timezone.now()
    local_now = timezone.localtime(now)
    today_key = local_now.date().isoformat()

    for user in User.objects.filter(is_active=True):
        user_offline = is_user_offline(user, reference_dt=now)

        if user_offline:
            due_soon_tasks = get_tasks_due_soon_for_email(user, reference_dt=now)
            if due_soon_tasks:
                due_soon_reference = f"due-soon:{today_key}:{due_soon_tasks[0].id}:{int(due_soon_tasks[0].due_date.timestamp())}"
                safe_send_email(
                    lambda user=user, due_soon_tasks=due_soon_tasks: send_due_soon_email(user, due_soon_tasks),
                    user=user,
                    email_type=EMAIL_TYPE_TASK_DUE_SOON,
                    reference_key=due_soon_reference,
                    metadata={"tasks_count": len(due_soon_tasks)},
                )

            became_overdue_tasks = get_tasks_became_overdue_for_email(user, reference_dt=now)
            if became_overdue_tasks:
                overdue_reference = f"became-overdue:{today_key}:{became_overdue_tasks[0].id}:{int(became_overdue_tasks[0].due_date.timestamp())}"
                safe_send_email(
                    lambda user=user, became_overdue_tasks=became_overdue_tasks: send_became_overdue_email(user, became_overdue_tasks),
                    user=user,
                    email_type=EMAIL_TYPE_TASK_BECAME_OVERDUE,
                    reference_key=overdue_reference,
                    metadata={"tasks_count": len(became_overdue_tasks)},
                )

            overdue_tasks, due_today_tasks = get_pending_tasks_for_email(user)
            if local_now.hour >= 8 and (overdue_tasks or due_today_tasks):
                safe_send_email(
                    lambda user=user, overdue_tasks=overdue_tasks, due_today_tasks=due_today_tasks: send_pending_activity_email(
                        user,
                        overdue_tasks,
                        due_today_tasks,
                    ),
                    user=user,
                    email_type=EMAIL_TYPE_PENDING_ACTIVITY,
                    reference_key=today_key,
                    metadata={
                        "overdue_count": len(overdue_tasks),
                        "due_today_count": len(due_today_tasks),
                    },
                )

        profile = get_profile(user)
        if local_now.hour >= 18 and profile.streak > 0 and profile.daily_goal_progress == 0:
            safe_send_email(
                lambda user=user, profile=profile: send_streak_warning_email(user, profile),
                user=user,
                email_type=EMAIL_TYPE_STREAK_WARNING,
                reference_key=today_key,
                metadata={
                    "streak": profile.streak,
                    "daily_goal_progress": profile.daily_goal_progress,
                },
            )

        iso_year, iso_week, _ = local_now.isocalendar()
        summary_key = f"{iso_year}-W{iso_week:02d}"
        if local_now.weekday() == 0 and local_now.hour >= 8:
            summary = build_weekly_productivity_summary(user, reference_dt=now)
            if summary["has_activity"]:
                safe_send_email(
                    lambda user=user, summary=summary: send_productivity_summary_email(user, summary),
                    user=user,
                    email_type=EMAIL_TYPE_PRODUCTIVITY_SUMMARY,
                    reference_key=summary_key,
                    metadata={
                        "week_label": summary["week_label"],
                        "focus_minutes": summary["focus_minutes"],
                        "completed_tasks_count": summary["completed_tasks_count"],
                    },
                )


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            sync_all_users_notifications,
            "interval",
            seconds=10,
            id="notifications_sync_job",
            replace_existing=True,
        )
        scheduler.add_job(
            dispatch_automated_emails,
            "interval",
            minutes=5,
            id="notifications_email_job",
            replace_existing=True,
        )

        scheduler.start()
