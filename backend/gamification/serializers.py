from rest_framework import serializers
from django.utils import timezone
from .models import UserProfile, StoreItem, UserInventory, Challenge


def is_today(profile: UserProfile) -> bool:
    return profile.last_activity == timezone.localdate()


class UserProfileSerializer(serializers.ModelSerializer):
    xp_progress_percent = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    chests = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "level",
            "current_xp",
            "xp_to_next_level",
            "xp_progress_percent",
            "coins",
            "streak",
            "pending_focus_minutes",
            "daily_goal_progress",
            "total_pomodoros",
            "total_tasks_completed",
            "chests",
            "badges",
        ]

    def get_xp_progress_percent(self, obj):
        if obj.xp_to_next_level <= 0:
            return 0
        return round((obj.current_xp / obj.xp_to_next_level) * 100, 2)

    def get_username(self, obj):
        full_name = obj.user.get_full_name().strip()
        if full_name:
            return full_name

        username_or_email = getattr(obj.user, "username", "") or getattr(obj.user, "email", "")

        if "@" in username_or_email:
            name_part = username_or_email.split("@")[0]
            return name_part.capitalize()

        return username_or_email.capitalize() if username_or_email else "Usuário"

    def get_chests(self, obj):
        same_day = is_today(obj)
        progress = obj.daily_goal_progress if same_day else 0

        wood_claimed = obj.wood_chest_claimed if same_day else False
        silver_claimed = obj.silver_chest_claimed if same_day else False
        gold_claimed = obj.gold_chest_claimed if same_day else False

        chests = [
            {
                "key": "wood",
                "type_label": "Madeira",
                "threshold": 33,
                "reward_label": "50 moedas",
                "claimed": wood_claimed,
                "unlocked": progress >= 33,
                "ready_to_claim": progress >= 33 and not wood_claimed,
            },
            {
                "key": "silver",
                "type_label": "Prata",
                "threshold": 66,
                "reward_label": "100 moedas",
                "claimed": silver_claimed,
                "unlocked": progress >= 66,
                "ready_to_claim": progress >= 66 and not silver_claimed,
            },
            {
                "key": "gold",
                "type_label": "Ouro",
                "threshold": 100,
                "reward_label": "200 moedas",
                "claimed": gold_claimed,
                "unlocked": progress >= 100,
                "ready_to_claim": progress >= 100 and not gold_claimed,
            },
        ]
        return chests

    def get_badges(self, obj):
        badges = [
            {
                "key": "first_task",
                "title": "Primeira Entrega",
                "description": "Conclua sua primeira tarefa no FocusFlow.",
                "icon": "target",
                "color": "blue",
                "current": min(obj.total_tasks_completed, 1),
                "target": 1,
                "unlocked": obj.total_tasks_completed >= 1,
            },
            {
                "key": "pomodoro_4",
                "title": "Foco Inicial",
                "description": "Complete 4 sessões de foco.",
                "icon": "clock",
                "color": "amber",
                "current": min(obj.total_pomodoros, 4),
                "target": 4,
                "unlocked": obj.total_pomodoros >= 4,
            },
            {
                "key": "streak_7",
                "title": "Sequência Consistente",
                "description": "Mantenha 7 dias consecutivos de atividade.",
                "icon": "flame",
                "color": "orange",
                "current": min(obj.streak, 7),
                "target": 7,
                "unlocked": obj.streak >= 7,
            },
            {
                "key": "tasks_25",
                "title": "Executor",
                "description": "Conclua 25 tarefas no total.",
                "icon": "zap",
                "color": "purple",
                "current": min(obj.total_tasks_completed, 25),
                "target": 25,
                "unlocked": obj.total_tasks_completed >= 25,
            },
            {
                "key": "level_5",
                "title": "Em Evolução",
                "description": "Alcance o nível 5.",
                "icon": "shield",
                "color": "emerald",
                "current": min(obj.level, 5),
                "target": 5,
                "unlocked": obj.level >= 5,
            },
        ]

        for badge in badges:
            target = badge["target"] or 1
            badge["progress_percent"] = round((badge["current"] / target) * 100, 2)

        return badges


class StoreItemSerializer(serializers.ModelSerializer):
    owned = serializers.SerializerMethodField()
    equipped = serializers.SerializerMethodField()

    class Meta:
        model = StoreItem
        fields = "__all__"

    def get_owned(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return UserInventory.objects.filter(user=request.user, item=obj).exists()

    def get_equipped(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return UserInventory.objects.filter(
            user=request.user,
            item=obj,
            is_equipped=True
        ).exists()


class ChallengeSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = "__all__"

    def get_progress_percent(self, obj):
        if obj.target_value <= 0:
            return 0
        return round((obj.current_value / obj.target_value) * 100, 2)