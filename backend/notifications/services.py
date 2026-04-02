from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from tasks.models import Task
from gamification.services import get_profile
from .models import Notification


def get_today_bounds():
    now = timezone.localtime()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    return start, end


def active_notifications_queryset(user):
    now = timezone.now()
    return (
        Notification.objects.filter(user=user, is_deleted=False)
        .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        .order_by("-created_at")
    )


def create_notification(
    *,
    user,
    type,
    title,
    description,
    priority="low",
    unique_key=None,
    metadata=None,
    expires_at=None,
):
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        description=description,
        priority=priority,
        unique_key=unique_key,
        metadata=metadata or {},
        expires_at=expires_at,
    )


def create_or_update_unique_notification(
    *,
    user,
    type,
    title,
    description,
    priority="low",
    unique_key,
    metadata=None,
    expires_at=None,
):
    notification = Notification.objects.filter(
        user=user,
        unique_key=unique_key,
    ).first()

    if notification:
        # Se o usuário apagou manualmente, não recria
        if notification.is_deleted:
            return notification

        notification.type = type
        notification.title = title
        notification.description = description
        notification.priority = priority
        notification.metadata = metadata or {}
        notification.expires_at = expires_at
        notification.save(
            update_fields=[
                "type",
                "title",
                "description",
                "priority",
                "metadata",
                "expires_at",
                "updated_at",
            ]
        )
        return notification

    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        description=description,
        priority=priority,
        unique_key=unique_key,
        metadata=metadata or {},
        expires_at=expires_at,
    )


def delete_notification_by_key(user, unique_key):
    now = timezone.now()
    Notification.objects.filter(
        user=user,
        unique_key=unique_key,
        is_deleted=False,
    ).update(
        is_deleted=True,
        deleted_at=now,
        updated_at=now,
    )


def sync_task_notifications(user):
    start, end = get_today_bounds()

    tasks = Task.objects.filter(user=user, completed_at__isnull=True)
    active_keys = set()

    for task in tasks:
        if not task.due_date:
            continue

        local_due_date = timezone.localtime(task.due_date)

        if local_due_date < start:
            key = f"task-overdue-{task.id}"
            active_keys.add(key)

            create_or_update_unique_notification(
                user=user,
                type="task_overdue",
                title="Tarefa atrasada",
                description=f'A tarefa "{task.title}" está atrasada e precisa de atenção.',
                priority="high",
                unique_key=key,
                metadata={"task_id": task.id},
                expires_at=None,
            )

        elif start <= local_due_date <= end:
            key = f"task-due-today-{task.id}"
            active_keys.add(key)

            create_or_update_unique_notification(
                user=user,
                type="task_due_today",
                title="Tarefa vence hoje",
                description=f'A tarefa "{task.title}" vence hoje.',
                priority="medium",
                unique_key=key,
                metadata={"task_id": task.id},
                expires_at=end + timedelta(hours=6),
            )

    stale_prefixes = ("task-overdue-", "task-due-today-")

    stale_notifications = active_notifications_queryset(user).filter(
        unique_key__isnull=False
    )

    for notification in stale_notifications:
        key = notification.unique_key or ""
        if key.startswith(stale_prefixes) and key not in active_keys:
            notification.soft_delete()


def sync_gamification_notifications(user):
    profile = get_profile(user)
    now = timezone.now()
    local_now = timezone.localtime(now)
    now_iso = now.isoformat()
    _, end = get_today_bounds()

    keys_that_should_exist = set()

    if profile.daily_goal_progress >= 100:
        key = "daily-goal-completed"
        keys_that_should_exist.add(key)

        create_or_update_unique_notification(
            user=user,
            type="daily_goal_completed",
            title="Meta diária concluída",
            description="Parabéns. Você concluiu sua meta diária de foco.",
            priority="low",
            unique_key=key,
            metadata={"generated_at": now_iso},
            expires_at=end + timedelta(days=3),
        )

    if profile.pending_focus_minutes > 0:
        key = "focus-coins-ready"
        keys_that_should_exist.add(key)

        create_or_update_unique_notification(
            user=user,
            type="focus_coins_ready",
            title="Minutos prontos para conversão",
            description=(
                f"Você possui {profile.pending_focus_minutes} minuto(s) de foco "
                "disponíveis para converter em moedas."
            ),
            priority="medium",
            unique_key=key,
            metadata={"generated_at": now_iso},
            expires_at=None,
        )

    chests = [
        ("wood", "Baú de madeira"),
        ("silver", "Baú de prata"),
        ("gold", "Baú dourado"),
    ]

    for chest_key, chest_label in chests:
        ready_field = f"{chest_key}_chest_ready"
        if hasattr(profile, ready_field) and getattr(profile, ready_field):
            key = f"chest-{chest_key}"
            keys_that_should_exist.add(key)

            create_or_update_unique_notification(
                user=user,
                type="chest_ready",
                title="Baú disponível",
                description=f"O {chest_label} está disponível para coleta.",
                priority="medium",
                unique_key=key,
                metadata={"chest_key": chest_key, "generated_at": now_iso},
                expires_at=None,
            )

    if profile.daily_goal_progress == 0 and local_now.hour >= 14:
        key = "no-focus-today"
        keys_that_should_exist.add(key)

        create_or_update_unique_notification(
            user=user,
            type="no_focus_today",
            title="Nenhuma sessão de foco hoje",
            description="Inicie uma sessão de foco para começar seu progresso diário.",
            priority="medium",
            unique_key=key,
            metadata={"generated_at": now_iso},
            expires_at=end + timedelta(hours=6),
        )

    if 50 <= profile.daily_goal_progress < 100:
        key = "good-progress-today"
        keys_that_should_exist.add(key)

        create_or_update_unique_notification(
            user=user,
            type="good_progress_today",
            title="Bom progresso diário",
            description=f"Você já concluiu {round(profile.daily_goal_progress)}% da meta diária.",
            priority="low",
            unique_key=key,
            metadata={"generated_at": now_iso},
            expires_at=end + timedelta(days=1),
        )

    if profile.streak > 0 and profile.daily_goal_progress == 0 and local_now.hour >= 18:
        key = "streak-warning"
        keys_that_should_exist.add(key)

        create_or_update_unique_notification(
            user=user,
            type="streak_warning",
            title="Sequência em risco",
            description=(
                f"Você está com {profile.streak} dia(s) de sequência. "
                "Faça uma sessão hoje para não perder."
            ),
            priority="high",
            unique_key=key,
            metadata={"generated_at": now_iso},
            expires_at=end + timedelta(hours=6),
        )

    if profile.streak > 0 and profile.daily_goal_progress > 0:
        key = "streak-congrats"
        keys_that_should_exist.add(key)

        create_or_update_unique_notification(
            user=user,
            type="streak_congrats",
            title="Sequência mantida",
            description=f"Você mantém uma sequência de {profile.streak} dia(s). Continue assim.",
            priority="low",
            unique_key=key,
            metadata={"generated_at": now_iso},
            expires_at=end + timedelta(days=2),
        )

    managed_prefixes = (
        "daily-goal-completed",
        "focus-coins-ready",
        "chest-",
        "no-focus-today",
        "good-progress-today",
        "streak-warning",
        "streak-congrats",
    )

    managed_notifications = active_notifications_queryset(user).filter(
        unique_key__isnull=False
    )

    for notification in managed_notifications:
        key = notification.unique_key or ""
        if key.startswith(managed_prefixes) and key not in keys_that_should_exist:
            notification.soft_delete()


def sync_user_notifications(user):
    sync_task_notifications(user)
    sync_gamification_notifications(user)


def notify_task_completed(task):
    create_notification(
        user=task.user,
        type="task_completed",
        title="Tarefa concluída",
        description=f'A tarefa "{task.title}" foi concluída com sucesso.',
        priority="low",
        unique_key=f"task-completed-{task.id}-{int(timezone.now().timestamp())}",
        metadata={"task_id": task.id},
        expires_at=timezone.now() + timedelta(days=7),
    )


def notify_level_up(user, new_level):
    create_or_update_unique_notification(
        user=user,
        type="level_up",
        title="Você subiu de nível!",
        description=f"Parabéns! Você alcançou o nível {new_level}.",
        priority="medium",
        unique_key=f"level-up-{new_level}",
        metadata={"level": new_level, "generated_at": timezone.now().isoformat()},
        expires_at=timezone.now() + timedelta(days=7),
    )