from datetime import timedelta

from django.db.models.functions import TruncDate
from django.utils import timezone

from .models import UserProfile


def get_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def get_local_today():
    return timezone.localtime(timezone.now()).date()


def refresh_daily_progress(profile):
    """
    Reseta apenas os dados diários quando realmente mudou o dia local.
    Mantém os dados globais intactos.
    """
    today = get_local_today()

    if profile.last_activity != today:
        profile.today_focus_minutes = 0
        profile.daily_goal_progress = 0
        profile.wood_chest_claimed = False
        profile.silver_chest_claimed = False
        profile.gold_chest_claimed = False
        profile.last_activity = today

        profile.save(update_fields=[
            "today_focus_minutes",
            "daily_goal_progress",
            "wood_chest_claimed",
            "silver_chest_claimed",
            "gold_chest_claimed",
            "last_activity",
        ])

    return today


def ensure_single_equipped_item(user, category, current_item):
    """
    Garante que apenas um item por categoria fique equipado.
    Mantém compatibilidade com o estado legado do inventário.
    """
    from .models import UserInventory

    UserInventory.objects.filter(
        user=user,
        item__category=category,
    ).update(is_equipped=False)

    inventory = UserInventory.objects.filter(
        user=user,
        item=current_item,
    ).first()

    if inventory:
        inventory.is_equipped = True
        inventory.save(update_fields=["is_equipped"])


def apply_level_up(profile):
    """
    Aplica evolução de nível em cascata, se o XP atual ultrapassar
    o XP necessário para o próximo nível.
    """
    while profile.current_xp >= profile.xp_to_next_level and profile.xp_to_next_level > 0:
        profile.current_xp -= profile.xp_to_next_level
        profile.level += 1
        profile.xp_to_next_level = max(100, profile.xp_to_next_level + 50)


def chest_required_minutes(goal_minutes, percent):
    return max(1, round(goal_minutes * (percent / 100)))


def calculate_daily_goal_progress(profile):
    goal_minutes = max(profile.daily_goal_minutes, 1)
    current_minutes = max(profile.today_focus_minutes, 0)
    progress = round((current_minutes / goal_minutes) * 100)
    return min(progress, 100)


def calculate_focus_streak(user, extra_active_date=None):
    """
    Calcula a sequência de dias com foco concluído.

    - Se o usuário tem foco hoje, a streak conta a partir de hoje.
    - Se ainda não focou hoje mas focou ontem, mantém a streak a partir de ontem.
    - Se o último foco foi antes de ontem, retorna 0.

    `extra_active_date` permite contabilizar uma sessão recém-concluída que ainda
    não foi persistida no banco.
    """
    from pomodoro.models import PomodoroSession

    focus_days = set(
        PomodoroSession.objects.filter(
            user=user,
            session_type="focus",
            status="completed",
            ended_at__isnull=False,
        )
        .annotate(day=TruncDate("ended_at"))
        .values_list("day", flat=True)
        .distinct()
    )

    if extra_active_date:
        focus_days.add(extra_active_date)

    if not focus_days:
        return 0

    today = get_local_today()
    yesterday = today - timedelta(days=1)

    if today in focus_days:
        current_day = today
    elif yesterday in focus_days:
        current_day = yesterday
    else:
        return 0

    streak = 0
    while current_day in focus_days:
        streak += 1
        current_day -= timedelta(days=1)

    return streak


def sync_profile_progress(profile, extra_active_date=None, save=True):
    refresh_daily_progress(profile)

    profile.daily_goal_progress = calculate_daily_goal_progress(profile)
    profile.streak = calculate_focus_streak(
        profile.user,
        extra_active_date=extra_active_date,
    )

    if save:
        profile.save(update_fields=["daily_goal_progress", "streak"])

    return profile


def grant_focus_progress(profile, focus_minutes, completed_pomodoro=False, save=True):
    """
    Aplica toda a progressão de gamificação derivada de foco.
    """
    refresh_daily_progress(profile)

    focus_minutes = max(int(focus_minutes or 0), 0)
    xp_gained = focus_minutes

    profile.current_xp += xp_gained
    profile.pending_focus_minutes += focus_minutes
    profile.today_focus_minutes += focus_minutes
    profile.total_focus_minutes += focus_minutes

    if completed_pomodoro:
        profile.total_pomodoros += 1

    profile.daily_goal_progress = calculate_daily_goal_progress(profile)
    profile.streak = calculate_focus_streak(
        profile.user,
        extra_active_date=get_local_today() if focus_minutes > 0 else None,
    )

    apply_level_up(profile)

    if save:
        profile.save()

    return xp_gained


def reward_completed_task(profile, xp_reward=15, coins_reward=10, save=True):
    refresh_daily_progress(profile)

    profile.total_tasks_completed += 1
    profile.current_xp += xp_reward
    profile.coins += coins_reward
    profile.daily_goal_progress = calculate_daily_goal_progress(profile)
    profile.streak = calculate_focus_streak(profile.user)

    apply_level_up(profile)

    if save:
        profile.save()

    return {
        "xp_reward": xp_reward,
        "coins_reward": coins_reward,
    }
