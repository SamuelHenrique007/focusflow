import logging
import os
from datetime import datetime, timedelta

import resend
from django.conf import settings
from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from gamification.models import UserProfile
from pomodoro.models import PomodoroSession
from tasks.models import Task

from .models import EmailNotificationLog

logger = logging.getLogger(__name__)


EMAIL_TYPE_WELCOME = "welcome_account"
EMAIL_TYPE_PENDING_ACTIVITY = "pending_activity"
EMAIL_TYPE_STREAK_WARNING = "streak_warning"
EMAIL_TYPE_PRODUCTIVITY_SUMMARY = "productivity_summary"


WEEKDAY_LABELS = {
    0: "segunda-feira",
    1: "terça-feira",
    2: "quarta-feira",
    3: "quinta-feira",
    4: "sexta-feira",
    5: "sábado",
    6: "domingo",
}


class EmailDeliveryError(Exception):
    pass


def _default_from_email() -> str:
    return getattr(settings, "DEFAULT_FROM_EMAIL", "FocusFlow <onboarding@resend.dev>")


def _frontend_url() -> str:
    return (getattr(settings, "FRONTEND_URL", "http://localhost:5173") or "http://localhost:5173").rstrip("/")


def _base_context(user):
    frontend_url = _frontend_url()
    return {
        "user_name": user.name or user.email,
        "current_year": datetime.now().year,
        "dashboard_link": f"{frontend_url}/dashboard",
        "tasks_link": f"{frontend_url}/tasks",
        "pomodoro_link": f"{frontend_url}/pomodoro",
        "statistics_link": f"{frontend_url}/statistics",
        "profile_link": f"{frontend_url}/profile",
    }


def send_templated_email(*, to_email: str, subject: str, template_base: str, context: dict) -> None:
    resend.api_key = os.getenv("RESEND_API_KEY")

    if not resend.api_key:
        raise EmailDeliveryError("RESEND_API_KEY não configurada.")

    text_content = render_to_string(f"{template_base}.txt", context)
    html_content = render_to_string(f"{template_base}.html", context)

    try:
        resend.Emails.send(
            {
                "from": _default_from_email(),
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": strip_tags(text_content).strip(),
            }
        )
    except Exception as exc:
        raise EmailDeliveryError(str(exc)) from exc


def was_email_sent(user, email_type: str, reference_key: str) -> bool:
    return EmailNotificationLog.objects.filter(
        user=user,
        email_type=email_type,
        reference_key=reference_key,
    ).exists()


def register_email_sent(user, email_type: str, reference_key: str, metadata: dict | None = None) -> None:
    EmailNotificationLog.objects.update_or_create(
        user=user,
        email_type=email_type,
        reference_key=reference_key,
        defaults={"metadata": metadata or {}, "last_sent_at": timezone.now()},
    )


def send_welcome_email(user) -> None:
    context = {
        **_base_context(user),
        "functionalities": [
            {
                "title": "Gestão de tarefas",
                "description": "Organize atividades, prioridades e prazos em um só lugar.",
            },
            {
                "title": "Sessões de foco",
                "description": "Use o cronômetro para manter constância e registrar tempo produtivo.",
            },
            {
                "title": "Gamificação",
                "description": "Acompanhe evolução por níveis, moedas, baús e sequência diária.",
            },
            {
                "title": "Indicadores de desempenho",
                "description": "Visualize seu histórico para acompanhar progresso e consistência.",
            },
        ],
    }

    send_templated_email(
        to_email=user.email,
        subject="Cadastro confirmado - FocusFlow",
        template_base="accounts/emails/welcome_account",
        context=context,
    )


def get_pending_tasks_for_email(user):
    now = timezone.localtime()
    day_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    overdue_tasks = list(
        Task.objects.filter(
            user=user,
            completed_at__isnull=True,
            due_date__isnull=False,
            due_date__lt=timezone.now(),
        )
        .order_by("due_date")[:5]
    )

    due_today_tasks = list(
        Task.objects.filter(
            user=user,
            completed_at__isnull=True,
            due_date__isnull=False,
            due_date__gte=now,
            due_date__lte=day_end,
        )
        .order_by("due_date")[:5]
    )

    return overdue_tasks, due_today_tasks


def send_pending_activity_email(user, overdue_tasks, due_today_tasks) -> None:
    total_overdue = len(overdue_tasks)
    total_due_today = len(due_today_tasks)

    context = {
        **_base_context(user),
        "overdue_tasks": overdue_tasks,
        "due_today_tasks": due_today_tasks,
        "has_overdue_tasks": total_overdue > 0,
        "has_due_today_tasks": total_due_today > 0,
        "overdue_count": total_overdue,
        "due_today_count": total_due_today,
        "reference_date": timezone.localdate().strftime("%d/%m/%Y"),
    }

    send_templated_email(
        to_email=user.email,
        subject="Atividades pendentes - FocusFlow",
        template_base="accounts/emails/pending_activity",
        context=context,
    )


def send_streak_warning_email(user, profile: UserProfile) -> None:
    missing_minutes = max(profile.daily_goal_minutes - profile.today_focus_minutes, 0)
    context = {
        **_base_context(user),
        "streak": profile.streak,
        "today_focus_minutes": profile.today_focus_minutes,
        "daily_goal_minutes": profile.daily_goal_minutes,
        "missing_minutes": missing_minutes,
        "progress_percent": round(profile.daily_goal_progress),
    }

    send_templated_email(
        to_email=user.email,
        subject="Sua sequência está em risco - FocusFlow",
        template_base="accounts/emails/streak_warning",
        context=context,
    )


def build_weekly_productivity_summary(user, reference_dt=None):
    local_now = timezone.localtime(reference_dt or timezone.now())
    week_start = (local_now - timedelta(days=local_now.weekday())).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    week_end = (week_start + timedelta(days=6)).replace(
        hour=23,
        minute=59,
        second=59,
        microsecond=999999,
    )

    completed_focus_sessions = PomodoroSession.objects.filter(
        user=user,
        session_type="focus",
        status="completed",
        ended_at__gte=week_start,
        ended_at__lte=week_end,
    )

    completed_tasks = Task.objects.filter(
        user=user,
        completed_at__isnull=False,
        completed_at__gte=week_start,
        completed_at__lte=week_end,
    )

    pending_tasks_count = Task.objects.filter(
        user=user,
        completed_at__isnull=True,
    ).count()

    focus_minutes = completed_focus_sessions.aggregate(
        total=Sum("planned_minutes")
    )["total"] or 0

    focus_sessions_count = completed_focus_sessions.count()
    completed_tasks_count = completed_tasks.count()
    average_focus_minutes = round(focus_minutes / focus_sessions_count) if focus_sessions_count else 0

    most_recent_task = (
        completed_tasks.order_by("-completed_at").first()
        or Task.objects.filter(user=user, completed_at__isnull=True).order_by("due_date", "created_at").first()
    )

    profile = getattr(user, "userprofile", None)
    if profile is None:
        profile = UserProfile.objects.filter(user=user).first()

    streak = profile.streak if profile else 0
    level = profile.level if profile else 1
    coins = profile.coins if profile else 0
    daily_goal_minutes = profile.daily_goal_minutes if profile else 0

    active_days = set(
        completed_focus_sessions.values_list("ended_at__date", flat=True)
    )
    consistency_rate = round((len(active_days) / 7) * 100) if active_days else 0

    has_activity = any([
        focus_minutes > 0,
        focus_sessions_count > 0,
        completed_tasks_count > 0,
        pending_tasks_count > 0,
    ])

    return {
        "week_start": week_start,
        "week_end": week_end,
        "week_label": (
            f"{week_start.strftime('%d/%m/%Y')} a {week_end.strftime('%d/%m/%Y')}"
        ),
        "focus_minutes": focus_minutes,
        "focus_sessions_count": focus_sessions_count,
        "completed_tasks_count": completed_tasks_count,
        "pending_tasks_count": pending_tasks_count,
        "average_focus_minutes": average_focus_minutes,
        "consistency_rate": consistency_rate,
        "streak": streak,
        "level": level,
        "coins": coins,
        "daily_goal_minutes": daily_goal_minutes,
        "next_recommended_action": (
            most_recent_task.title if most_recent_task else "Revisar prioridades da próxima sessão"
        ),
        "has_activity": has_activity,
    }


def send_productivity_summary_email(user, summary: dict) -> None:
    context = {
        **_base_context(user),
        **summary,
        "summary_weekday": WEEKDAY_LABELS.get(timezone.localtime().weekday(), "segunda-feira"),
    }

    send_templated_email(
        to_email=user.email,
        subject="Resumo periódico de produtividade - FocusFlow",
        template_base="accounts/emails/productivity_summary",
        context=context,
    )


def safe_send_email(callback, *, user, email_type: str, reference_key: str, metadata: dict | None = None) -> bool:
    if was_email_sent(user, email_type, reference_key):
        return False

    try:
        callback()
    except EmailDeliveryError:
        logger.exception(
            "Falha ao enviar e-mail '%s' para o usuário %s.",
            email_type,
            user.email,
        )
        return False

    register_email_sent(user, email_type, reference_key, metadata=metadata)
    return True
