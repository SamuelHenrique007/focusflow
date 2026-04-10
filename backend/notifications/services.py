from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from django.utils import timezone

from tasks.models import Task
from gamification.services import get_profile, chest_required_minutes
from .models import Notification
from .realtime import broadcast_notifications_state


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


def build_notifications_snapshot(user):
    notifications = active_notifications_queryset(user)
    unread_count = notifications.filter(is_read=False).count()
    total_count = notifications.count()

    return {
        "unreadCount": unread_count,
        "totalCount": total_count,
        "hasUnreadNotifications": unread_count > 0,
    }


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
    broadcast=True,
):
    notification = Notification.objects.create(
        user=user,
        type=type,
        title=title,
        description=description,
        priority=priority,
        unique_key=unique_key,
        metadata=metadata or {},
        expires_at=expires_at,
    )

    if broadcast:
        broadcast_notifications_state(
            user,
            event_type="notifications.created",
            notification_id=notification.id,
        )

    return notification


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
    broadcast=True,
):
    notification = Notification.objects.filter(
        user=user,
        unique_key=unique_key,
    ).first()

    changed = False
    next_metadata = metadata or {}

    if notification:
        if notification.is_deleted:
            can_reappear = {
                "focus_coins_ready",
            }

            if type in can_reappear:
                notification.is_deleted = False
                notification.is_read = False
                notification.type = type
                notification.title = title
                notification.description = description
                notification.priority = priority
                notification.metadata = next_metadata
                notification.expires_at = expires_at
                notification.save(
                    update_fields=[
                        "is_deleted",
                        "is_read",
                        "type",
                        "title",
                        "description",
                        "priority",
                        "metadata",
                        "expires_at",
                        "updated_at",
                    ]
                )
                changed = True
            else:
                return notification, False

        else:
            fields_changed = any(
                [
                    notification.type != type,
                    notification.title != title,
                    notification.description != description,
                    notification.priority != priority,
                    notification.metadata != next_metadata,
                    notification.expires_at != expires_at,
                ]
            )

            if fields_changed:
                notification.type = type
                notification.title = title
                notification.description = description
                notification.priority = priority
                notification.metadata = next_metadata
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
                changed = True
    else:
        notification = Notification.objects.create(
            user=user,
            type=type,
            title=title,
            description=description,
            priority=priority,
            unique_key=unique_key,
            metadata=next_metadata,
            expires_at=expires_at,
        )
        changed = True

    if broadcast and changed:
        broadcast_notifications_state(
            user,
            event_type="notifications.updated",
            notification_id=notification.id,
        )

    return notification, changed


def sync_task_notifications(user):
    now = timezone.localtime()
    start, end = get_today_bounds()

    tasks = Task.objects.filter(user=user, completed_at__isnull=True)
    active_keys = set()
    changed = False

    for task in tasks:
        if not task.due_date:
            continue

        local_due_date = timezone.localtime(task.due_date)

        if local_due_date < now:
            key = f"task-overdue-{task.id}"
            active_keys.add(key)

            _, notification_changed = create_or_update_unique_notification(
                user=user,
                type="task_overdue",
                title="Tarefa atrasada",
                description=f'A tarefa "{task.title}" está atrasada e precisa de atenção.',
                priority="high",
                unique_key=key,
                metadata={"task_id": task.id},
                expires_at=None,
                broadcast=False,
            )
            changed = changed or notification_changed

        elif start <= local_due_date <= end:
            key = f"task-due-today-{task.id}"
            active_keys.add(key)

            _, notification_changed = create_or_update_unique_notification(
                user=user,
                type="task_due_today",
                title="Tarefa vence hoje",
                description=f'A tarefa "{task.title}" vence hoje.',
                priority="medium",
                unique_key=key,
                metadata={"task_id": task.id},
                expires_at=end + timedelta(hours=6),
                broadcast=False,
            )
            changed = changed or notification_changed

    stale_prefixes = ("task-overdue-", "task-due-today-")
    stale_notifications = active_notifications_queryset(user).filter(unique_key__isnull=False)

    for notification in stale_notifications:
        key = notification.unique_key or ""
        if key.startswith(stale_prefixes) and key not in active_keys:
            notification.soft_delete()
            changed = True

    return changed


def sync_gamification_notifications(user):
    profile = get_profile(user)
    now = timezone.now()
    local_now = timezone.localtime(now)
    _, end = get_today_bounds()

    today_str = local_now.date().isoformat()
    keys_that_should_exist = set()
    changed = False

    if profile.daily_goal_progress >= 100:
        key = f"daily-goal-completed-{today_str}"
        keys_that_should_exist.add(key)

        _, notification_changed = create_or_update_unique_notification(
            user=user,
            type="daily_goal_completed",
            title="Meta diária concluída",
            description="Parabéns. Você concluiu sua meta diária de foco.",
            priority="low",
            unique_key=key,
            metadata={"date": today_str},
            expires_at=end + timedelta(days=3),
            broadcast=False,
        )
        changed = changed or notification_changed

    if profile.pending_focus_minutes > 0:
        key = f"focus-coins-{profile.pending_focus_minutes}"
        keys_that_should_exist.add(key)

        _, notification_changed = create_or_update_unique_notification(
            user=user,
            type="focus_coins_ready",
            title="Minutos prontos para conversão",
            description=(
                f"Você possui {profile.pending_focus_minutes} minuto(s) de foco "
                "disponíveis para converter em moedas."
            ),
            priority="medium",
            unique_key=key,
            metadata={"pending_focus_minutes": profile.pending_focus_minutes},
            expires_at=None,
            broadcast=False,
        )
        changed = changed or notification_changed

    chests = [
        ("wood", "Baú de madeira", 30, "wood_chest_claimed"),
        ("silver", "Baú de prata", 60, "silver_chest_claimed"),
        ("gold", "Baú dourado", 100, "gold_chest_claimed"),
    ]

    goal_minutes = max(profile.daily_goal_minutes, 1)
    current_minutes = max(profile.today_focus_minutes, 0)

    for chest_key, chest_label, threshold_percent, claimed_field in chests:
        required_minutes = chest_required_minutes(goal_minutes, threshold_percent)
        claimed = getattr(profile, claimed_field, False)
        ready_to_claim = current_minutes >= required_minutes and not claimed

        if ready_to_claim:
            key = f"chest-{chest_key}-{today_str}"
            keys_that_should_exist.add(key)

            _, notification_changed = create_or_update_unique_notification(
                user=user,
                type="chest_ready",
                title="Baú disponível",
                description=f"O {chest_label} está disponível para coleta.",
                priority="medium",
                unique_key=key,
                metadata={
                    "chest_key": chest_key,
                    "date": today_str,
                    "required_minutes": required_minutes,
                    "current_minutes": current_minutes,
                },
                expires_at=None,
                broadcast=False,
            )
            changed = changed or notification_changed

    if profile.daily_goal_progress == 0 and local_now.hour >= 14:
        key = f"no-focus-today-{today_str}"
        keys_that_should_exist.add(key)

        _, notification_changed = create_or_update_unique_notification(
            user=user,
            type="no_focus_today",
            title="Nenhuma sessão de foco hoje",
            description="Inicie uma sessão de foco para começar seu progresso diário.",
            priority="medium",
            unique_key=key,
            metadata={"date": today_str},
            expires_at=end + timedelta(hours=6),
            broadcast=False,
        )
        changed = changed or notification_changed

    if 50 <= profile.daily_goal_progress < 100:
        key = f"good-progress-today-{today_str}"
        keys_that_should_exist.add(key)

        _, notification_changed = create_or_update_unique_notification(
            user=user,
            type="good_progress_today",
            title="Bom progresso diário",
            description=f"Você já concluiu {round(profile.daily_goal_progress)}% da meta diária.",
            priority="low",
            unique_key=key,
            metadata={"date": today_str, "progress": round(profile.daily_goal_progress)},
            expires_at=end + timedelta(days=1),
            broadcast=False,
        )
        changed = changed or notification_changed

    if profile.streak > 0 and profile.daily_goal_progress == 0 and local_now.hour >= 18:
        key = f"streak-warning-{today_str}"
        keys_that_should_exist.add(key)

        _, notification_changed = create_or_update_unique_notification(
            user=user,
            type="streak_warning",
            title="Sequência em risco",
            description=(
                f"Você está com {profile.streak} dia(s) de sequência. "
                "Faça uma sessão hoje para não perder."
            ),
            priority="high",
            unique_key=key,
            metadata={"date": today_str, "streak": profile.streak},
            expires_at=end + timedelta(hours=6),
            broadcast=False,
        )
        changed = changed or notification_changed

    if profile.streak > 0 and profile.daily_goal_progress > 0:
        key = f"streak-congrats-{today_str}"
        keys_that_should_exist.add(key)

        _, notification_changed = create_or_update_unique_notification(
            user=user,
            type="streak_congrats",
            title="Sequência mantida",
            description=f"Você mantém uma sequência de {profile.streak} dia(s). Continue assim.",
            priority="low",
            unique_key=key,
            metadata={"date": today_str, "streak": profile.streak},
            expires_at=end + timedelta(days=2),
            broadcast=False,
        )
        changed = changed or notification_changed

    managed_prefixes = (
        "daily-goal-completed-",
        "focus-coins-",
        "chest-",
        "no-focus-today-",
        "good-progress-today-",
        "streak-warning-",
        "streak-congrats-",
    )

    managed_notifications = active_notifications_queryset(user).filter(unique_key__isnull=False)

    for notification in managed_notifications:
        key = notification.unique_key or ""
        if key.startswith(managed_prefixes) and key not in keys_that_should_exist:
            notification.soft_delete()
            changed = True

    return changed


def sync_user_notifications(user):
    task_changed = sync_task_notifications(user)
    gamification_changed = sync_gamification_notifications(user)

    if task_changed or gamification_changed:
        broadcast_notifications_state(user)

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
    notification, changed = create_or_update_unique_notification(
        user=user,
        type="level_up",
        title="Você subiu de nível!",
        description=f"Parabéns! Você alcançou o nível {new_level}.",
        priority="medium",
        unique_key=f"level-up-{new_level}",
        metadata={"level": new_level},
        expires_at=timezone.now() + timedelta(days=7),
        broadcast=False,
    )

    if changed:
        broadcast_notifications_state(
            user,
            event_type="level_up",
            notification_id=notification.id,
        )