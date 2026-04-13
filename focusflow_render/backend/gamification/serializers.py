from rest_framework import serializers

from .models import StoreItem, UserInventory, UserProfile
from .services import build_badges, build_daily_challenges, build_profile_metrics


CHEST_CONFIG = [
    {
        "key": "wood",
        "type_label": "Baú de Madeira",
        "threshold_percent": 30,
        "reward_label": "+20 moedas",
        "coins_reward": 20,
        "xp_reward": 0,
        "claimed_field": "wood_chest_claimed",
    },
    {
        "key": "silver",
        "type_label": "Baú de Prata",
        "threshold_percent": 60,
        "reward_label": "+40 moedas",
        "coins_reward": 40,
        "xp_reward": 0,
        "claimed_field": "silver_chest_claimed",
    },
    {
        "key": "gold",
        "type_label": "Baú Dourado",
        "threshold_percent": 100,
        "reward_label": "+80 moedas +25 XP",
        "coins_reward": 80,
        "xp_reward": 25,
        "claimed_field": "gold_chest_claimed",
    },
]


def chest_required_minutes(goal_minutes, percent):
    return max(1, round(goal_minutes * (percent / 100)))


class StoreItemSerializer(serializers.ModelSerializer):
    owned = serializers.SerializerMethodField()
    equipped = serializers.SerializerMethodField()

    class Meta:
        model = StoreItem
        fields = [
            "id",
            "name",
            "description",
            "category",
            "rarity",
            "price",
            "required_level",
            "visual_resource",
            "owned",
            "equipped",
        ]

    def get_owned(self, obj):
        owned_item_ids = self.context.get("owned_item_ids")
        if owned_item_ids is not None:
            return obj.id in owned_item_ids

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return UserInventory.objects.filter(user=request.user, item=obj).exists()

    def get_equipped(self, obj):
        profile = self.context.get("profile")

        if profile is None:
            request = self.context.get("request")
            if not request or not request.user.is_authenticated:
                return False
            profile, _ = UserProfile.objects.get_or_create(user=request.user)

        if obj.category == "avatar":
            return profile.equipped_avatar_item_id == obj.id

        if obj.category == "sound":
            return profile.equipped_sound_item_id == obj.id

        if obj.category == "theme":
            return profile.equipped_theme_item_id == obj.id

        return False


class UserInventorySerializer(serializers.ModelSerializer):
    item = StoreItemSerializer(read_only=True)

    class Meta:
        model = UserInventory
        fields = [
            "id",
            "item",
            "is_equipped",
            "purchased_at",
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    xp_progress_percent = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    next_level_xp = serializers.SerializerMethodField()
    inventory = serializers.SerializerMethodField()
    daily_goal_progress = serializers.SerializerMethodField()
    chests = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()
    challenges = serializers.SerializerMethodField()
    equipped_avatar = serializers.SerializerMethodField()
    equipped_sound = serializers.SerializerMethodField()
    equipped_theme = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "level",
            "current_xp",
            "xp_to_next_level",
            "next_level_xp",
            "xp_progress_percent",
            "coins",
            "streak",
            "pending_focus_minutes",
            "daily_goal_minutes",
            "daily_goal_progress",
            "total_pomodoros",
            "total_focus_minutes",
            "total_tasks_completed",
            "inventory",
            "chests",
            "badges",
            "challenges",
            "equipped_avatar",
            "equipped_sound",
            "equipped_theme",
        ]

    def _serialize_equipped_item(self, item):
        if not item:
            return None

        return {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "visual_resource": item.visual_resource,
            "rarity": item.rarity,
        }

    def get_username(self, obj):
        return obj.user.username

    def get_xp_progress_percent(self, obj):
        if obj.xp_to_next_level == 0:
            return 0

        return round((obj.current_xp / obj.xp_to_next_level) * 100, 2)

    def get_next_level_xp(self, obj):
        return obj.xp_to_next_level

    def get_inventory(self, obj):
        return list(
            UserInventory.objects.filter(user=obj.user).values_list("item_id", flat=True)
        )

    def get_daily_goal_progress(self, obj):
        goal_minutes = max(obj.daily_goal_minutes, 1)
        current_minutes = max(obj.today_focus_minutes, 0)
        progress = round((current_minutes / goal_minutes) * 100)
        return min(progress, 100)

    def get_chests(self, obj):
        current_minutes = max(obj.today_focus_minutes, 0)
        goal_minutes = max(obj.daily_goal_minutes, 1)

        chests = []
        for chest in CHEST_CONFIG:
            claimed = getattr(obj, chest["claimed_field"])
            required_minutes = chest_required_minutes(
                goal_minutes,
                chest["threshold_percent"],
            )
            unlocked = current_minutes >= required_minutes

            chests.append(
                {
                    "key": chest["key"],
                    "type_label": chest["type_label"],
                    "threshold_percent": chest["threshold_percent"],
                    "required_minutes": required_minutes,
                    "current_minutes": current_minutes,
                    "reward_label": chest["reward_label"],
                    "claimed": claimed,
                    "unlocked": unlocked,
                    "ready_to_claim": unlocked and not claimed,
                }
            )

        return chests

    def get_badges(self, obj):
        precomputed = self.context.get("precomputed_badges")
        if precomputed is not None:
            return precomputed

        metrics = self.context.get("profile_metrics")
        return build_badges(obj, metrics=metrics)

    def get_challenges(self, obj):
        precomputed = self.context.get("precomputed_challenges")
        if precomputed is not None:
            return precomputed

        metrics = self.context.get("profile_metrics")
        return build_daily_challenges(obj, metrics=metrics)

    def get_equipped_avatar(self, obj):
        return self._serialize_equipped_item(obj.equipped_avatar_item)

    def get_equipped_sound(self, obj):
        return self._serialize_equipped_item(obj.equipped_sound_item)

    def get_equipped_theme(self, obj):
        return self._serialize_equipped_item(obj.equipped_theme_item)


def serialize_profile(profile):
    metrics = build_profile_metrics(profile)
    serializer = UserProfileSerializer(
        profile,
        context={
            "profile": profile,
            "profile_metrics": metrics,
        },
    )
    return serializer.data
