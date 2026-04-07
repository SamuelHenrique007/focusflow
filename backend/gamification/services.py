from datetime import timedelta

from django.db.models.functions import TruncDate
from django.utils import timezone

from .models import UserProfile


BADGE_DEFINITIONS = [
    {
        "key": "first_pomodoro",
        "title": "Primeiro Foco",
        "description": "Complete seu primeiro pomodoro de foco.",
        "icon": "clock",
        "color": "blue",
        "metric": "total_pomodoros",
        "target": 1,
    },
    {
        "key": "three_pomodoros_day",
        "title": "Ritmo Forte",
        "description": "Complete 3 pomodoros em um único dia.",
        "icon": "zap",
        "color": "purple",
        "metric": "today_completed_pomodoros",
        "target": 3,
    },
    {
        "key": "seven_day_streak",
        "title": "Em Chamas",
        "description": "Mantenha uma sequência de 7 dias de foco.",
        "icon": "flame",
        "color": "orange",
        "metric": "streak",
        "target": 7,
    },
    {
        "key": "ten_tasks_completed",
        "title": "Finalizador",
        "description": "Conclua 10 tarefas.",
        "icon": "target",
        "color": "amber",
        "metric": "total_tasks_completed",
        "target": 10,
    },
    {
        "key": "hundred_focus_minutes",
        "title": "Guardião do Foco",
        "description": "Acumule 100 minutos de foco.",
        "icon": "shield",
        "color": "emerald",
        "metric": "total_focus_minutes",
        "target": 100,
    },
]


DAILY_CHALLENGE_DEFINITIONS = [
    {
        "key": "daily_two_pomodoros",
        "title": "Sprint do Dia",
        "description": "Conclua 2 pomodoros hoje.",
        "metric": "today_completed_pomodoros",
        "target": 2,
        "xp_reward": 15,
        "coin_reward": 15,
        "icon": "clock",
    },
    {
        "key": "daily_sixty_minutes",
        "title": "Meta de 60 Min",
        "description": "Acumule 60 minutos de foco hoje.",
        "metric": "today_focus_minutes",
        "target": 60,
        "xp_reward": 20,
        "coin_reward": 20,
        "icon": "flame",
    },
    {
        "key": "daily_three_tasks",
        "title": "Dia Produtivo",
        "description": "Conclua 3 tarefas hoje.",
        "metric": "today_completed_tasks",
        "target": 3,
        "xp_reward": 20,
        "coin_reward": 25,
        "icon": "target",
    },
]


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

    state = profile.daily_challenge_state or {}
    state_date = state.get("date")

    if profile.last_activity != today:
        profile.today_focus_minutes = 0
        profile.daily_goal_progress = 0
        profile.wood_chest_claimed = False
        profile.silver_chest_claimed = False
        profile.gold_chest_claimed = False
        profile.last_activity = today
        profile.daily_challenge_state = {
            "date": today.isoformat(),
            "claimed": [],
        }

        profile.save(update_fields=[
            "today_focus_minutes",
            "daily_goal_progress",
            "wood_chest_claimed",
            "silver_chest_claimed",
            "gold_chest_claimed",
            "last_activity",
            "daily_challenge_state",
        ])
    elif state_date != today.isoformat():
        profile.daily_challenge_state = {
            "date": today.isoformat(),
            "claimed": [],
        }
        profile.save(update_fields=["daily_challenge_state"])

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

    Retorna a lista de níveis alcançados nesta atualização.
    """
    gained_levels = []

    while profile.current_xp >= profile.xp_to_next_level and profile.xp_to_next_level > 0:
        profile.current_xp -= profile.xp_to_next_level
        profile.level += 1
        profile.xp_to_next_level = max(100, profile.xp_to_next_level + 50)
        gained_levels.append(profile.level)

    return gained_levels


def finalize_gamification_notifications(profile, gained_levels=None):
    """
    Centraliza a sincronização das notificações de gamificação
    e dispara aviso de subida de nível quando necessário.
    """
    from notifications.services import notify_level_up, sync_user_notifications

    for level in gained_levels or []:
        notify_level_up(profile.user, level)

    sync_user_notifications(profile.user)


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


def get_today_completed_pomodoros(user):
    from pomodoro.models import PomodoroSession

    today = get_local_today()
    return PomodoroSession.objects.filter(
        user=user,
        session_type="focus",
        status="completed",
        ended_at__date=today,
    ).count()


def get_today_completed_tasks(user):
    from tasks.models import Task

    today = get_local_today()
    return Task.objects.filter(
        user=user,
        completed_at__date=today,
    ).count()


def get_badge_metric_value(profile, metric):
    if metric == "today_completed_pomodoros":
        return get_today_completed_pomodoros(profile.user)

    return getattr(profile, metric, 0)


def build_badges(profile):
    badges = []

    for definition in BADGE_DEFINITIONS:
        current = get_badge_metric_value(profile, definition["metric"])
        target = definition["target"]
        progress_percent = 100 if target <= 0 else min(round((current / target) * 100, 2), 100)

        badges.append(
            {
                "key": definition["key"],
                "title": definition["title"],
                "description": definition["description"],
                "icon": definition["icon"],
                "color": definition["color"],
                "current": current,
                "target": target,
                "unlocked": current >= target,
                "progress_percent": progress_percent,
            }
        )

    return badges


def get_daily_challenge_metric_value(profile, metric):
    if metric == "today_completed_pomodoros":
        return get_today_completed_pomodoros(profile.user)
    if metric == "today_completed_tasks":
        return get_today_completed_tasks(profile.user)
    return getattr(profile, metric, 0)


def build_daily_challenges(profile):
    refresh_daily_progress(profile)
    state = profile.daily_challenge_state or {}
    claimed_keys = set(state.get("claimed", []))

    challenges = []

    for definition in DAILY_CHALLENGE_DEFINITIONS:
        current = get_daily_challenge_metric_value(profile, definition["metric"])
        target = definition["target"]
        completed = current >= target
        claimed = definition["key"] in claimed_keys
        progress_percent = 100 if target <= 0 else min(round((current / target) * 100, 2), 100)

        challenges.append(
            {
                "key": definition["key"],
                "title": definition["title"],
                "description": definition["description"],
                "icon": definition["icon"],
                "current": current,
                "target": target,
                "completed": completed,
                "claimed": claimed,
                "reward_xp": definition["xp_reward"],
                "reward_coins": definition["coin_reward"],
                "progress_percent": progress_percent,
            }
        )

    return challenges


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


def grant_daily_challenge_rewards(profile, save=True):
    refresh_daily_progress(profile)
    state = profile.daily_challenge_state or {
        "date": get_local_today().isoformat(),
        "claimed": [],
    }
    claimed_keys = set(state.get("claimed", []))
    earned = []

    for challenge in build_daily_challenges(profile):
        if challenge["completed"] and challenge["key"] not in claimed_keys:
            profile.current_xp += challenge["reward_xp"]
            profile.coins += challenge["reward_coins"]
            claimed_keys.add(challenge["key"])
            earned.append(
                {
                    "key": challenge["key"],
                    "title": challenge["title"],
                    "xp_reward": challenge["reward_xp"],
                    "coin_reward": challenge["reward_coins"],
                }
            )

    if earned:
        state["date"] = get_local_today().isoformat()
        state["claimed"] = sorted(claimed_keys)
        profile.daily_challenge_state = state
        gained_levels = apply_level_up(profile)

        if save:
            profile.save()
            finalize_gamification_notifications(profile, gained_levels)
    elif save and profile.daily_challenge_state != state:
        profile.daily_challenge_state = state
        profile.save(update_fields=["daily_challenge_state"])

    return earned


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

    gained_levels = apply_level_up(profile)

    if save:
        profile.save()
        grant_daily_challenge_rewards(profile)
        finalize_gamification_notifications(profile, gained_levels)

    return xp_gained


def reward_completed_task(profile, xp_reward=15, coins_reward=10, save=True):
    refresh_daily_progress(profile)

    profile.total_tasks_completed += 1
    profile.current_xp += xp_reward
    profile.coins += coins_reward
    profile.daily_goal_progress = calculate_daily_goal_progress(profile)
    profile.streak = calculate_focus_streak(profile.user)

    gained_levels = apply_level_up(profile)

    if save:
        profile.save()
        grant_daily_challenge_rewards(profile)
        finalize_gamification_notifications(profile, gained_levels)

    return {
        "xp_reward": xp_reward,
        "coins_reward": coins_reward,
    }
