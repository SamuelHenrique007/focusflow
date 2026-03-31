from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import StoreItem, UserInventory
from .serializers import (
    StoreItemSerializer,
    UserInventorySerializer,
    UserProfileSerializer,
    serialize_profile,
)
from .services import (
    apply_level_up,
    chest_required_minutes,
    ensure_single_equipped_item,
    get_profile,
    grant_focus_progress,
    refresh_daily_progress,
    reward_completed_task,
    grant_daily_challenge_rewards,
    sync_profile_progress,
)

CHEST_REWARDS = {
    "wood": {
        "threshold_percent": 30,
        "coins_reward": 20,
        "xp_reward": 0,
        "claimed_field": "wood_chest_claimed",
        "label": "Baú de Madeira",
    },
    "silver": {
        "threshold_percent": 60,
        "coins_reward": 40,
        "xp_reward": 0,
        "claimed_field": "silver_chest_claimed",
        "label": "Baú de Prata",
    },
    "gold": {
        "threshold_percent": 100,
        "coins_reward": 80,
        "xp_reward": 25,
        "claimed_field": "gold_chest_claimed",
        "label": "Baú Dourado",
    },
}


class GameStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_profile(request.user)
        sync_profile_progress(profile)
        grant_daily_challenge_rewards(profile)
        profile.refresh_from_db()

        serializer = UserProfileSerializer(profile)

        return Response(
            {
                "success": True,
                "stats": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class StoreItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = StoreItem.objects.all().order_by(
            "category",
            "required_level",
            "price",
            "id",
        )

        serializer = StoreItemSerializer(
            items,
            many=True,
            context={"request": request},
        )

        return Response(
            {
                "success": True,
                "items": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class UserInventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inventory = UserInventory.objects.filter(
            user=request.user
        ).select_related("item").order_by("-purchased_at")

        serializer = UserInventorySerializer(inventory, many=True)

        return Response(
            {
                "success": True,
                "items": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class PurchaseStoreItemView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, item_id):
        profile = get_profile(request.user)
        item = get_object_or_404(StoreItem, id=item_id)

        already_owned = UserInventory.objects.filter(
            user=request.user,
            item=item,
        ).exists()

        if already_owned:
            return Response(
                {
                    "success": False,
                    "error": "Você já possui este item.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.level < item.required_level:
            return Response(
                {
                    "success": False,
                    "error": "Seu nível ainda não permite comprar este item.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.coins < item.price:
            return Response(
                {
                    "success": False,
                    "error": "Moedas insuficientes para esta compra.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.coins -= item.price
        profile.save(update_fields=["coins"])

        UserInventory.objects.create(
            user=request.user,
            item=item,
            is_equipped=False,
        )

        sync_profile_progress(profile)

        return Response(
            {
                "success": True,
                "message": f"Item '{item.name}' comprado com sucesso.",
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK,
        )


class EquipItemView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, item_id):
        profile = get_profile(request.user)
        item = get_object_or_404(StoreItem, id=item_id)

        inventory = UserInventory.objects.filter(
            user=request.user,
            item=item,
        ).first()

        if not inventory:
            return Response(
                {
                    "success": False,
                    "error": "Você precisa comprar este item antes de equipá-lo.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if item.category == "avatar":
            profile.equipped_avatar_item = item
        elif item.category == "sound":
            profile.equipped_sound_item = item
        elif item.category == "theme":
            profile.equipped_theme_item = item
        else:
            return Response(
                {
                    "success": False,
                    "error": "Categoria de item inválida para equipar.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.save()

        ensure_single_equipped_item(
            user=request.user,
            category=item.category,
            current_item=item,
        )

        sync_profile_progress(profile)

        return Response(
            {
                "success": True,
                "message": f"Item '{item.name}' equipado com sucesso.",
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK,
        )


class ConvertFocusMinutesView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile = get_profile(request.user)
        refresh_daily_progress(profile)

        minutes = profile.pending_focus_minutes

        if minutes <= 0:
            return Response(
                {
                    "success": False,
                    "error": "Não há minutos pendentes para converter.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        earned_coins = minutes

        profile.coins += earned_coins
        profile.pending_focus_minutes = 0
        profile.save(update_fields=["coins", "pending_focus_minutes"])

        sync_profile_progress(profile)

        return Response(
            {
                "success": True,
                "message": f"{earned_coins} moedas adicionadas com sucesso.",
                "earned_coins": earned_coins,
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK,
        )


class AddProgressView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        """
        Endpoint utilitário para testes ou integrações internas.
        Espera:
        {
            "focus_minutes": 25,
            "completed_pomodoro": true,
            "completed_task": false
        }
        """
        profile = get_profile(request.user)

        focus_minutes = int(request.data.get("focus_minutes", 0))
        completed_pomodoro = bool(request.data.get("completed_pomodoro", False))
        completed_task = bool(request.data.get("completed_task", False))

        if focus_minutes < 0:
            return Response(
                {
                    "success": False,
                    "error": "focus_minutes não pode ser negativo.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        xp_gained = grant_focus_progress(
            profile,
            focus_minutes=focus_minutes,
            completed_pomodoro=completed_pomodoro,
        )

        if completed_task:
            reward_completed_task(profile, save=False)
            profile.save()

        return Response(
            {
                "success": True,
                "message": "Progresso adicionado com sucesso.",
                "xp_gained": xp_gained,
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK,
        )


class ClaimChestView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, chest_type):
        profile = get_profile(request.user)
        refresh_daily_progress(profile)

        chest = CHEST_REWARDS.get(chest_type)

        if not chest:
            return Response(
                {
                    "success": False,
                    "error": "Tipo de baú inválido.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        claimed_field = chest["claimed_field"]
        already_claimed = getattr(profile, claimed_field)

        if already_claimed:
            return Response(
                {
                    "success": False,
                    "error": "Este baú já foi resgatado.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        goal_minutes = max(profile.daily_goal_minutes, 1)
        required_minutes = chest_required_minutes(
            goal_minutes,
            chest["threshold_percent"],
        )
        current_minutes = max(profile.today_focus_minutes, 0)

        if current_minutes < required_minutes:
            return Response(
                {
                    "success": False,
                    "error": "Meta diária ainda insuficiente para resgatar este baú.",
                    "required_minutes": required_minutes,
                    "current_minutes": current_minutes,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.coins += chest["coins_reward"]
        profile.current_xp += chest["xp_reward"]
        setattr(profile, claimed_field, True)

        apply_level_up(profile)
        profile.save()

        sync_profile_progress(profile)

        reward_parts = []
        if chest["coins_reward"] > 0:
            reward_parts.append(f"{chest['coins_reward']} moedas")
        if chest["xp_reward"] > 0:
            reward_parts.append(f"{chest['xp_reward']} XP")

        reward_text = " + ".join(reward_parts)

        return Response(
            {
                "success": True,
                "message": f"{chest['label']} resgatado com sucesso. Recompensa: {reward_text}.",
                "earned_coins": chest["coins_reward"],
                "xp_gained": chest["xp_reward"],
                "required_minutes": required_minutes,
                "current_minutes": current_minutes,
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK,
        )


class CompleteTaskRewardView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile = get_profile(request.user)
        rewards = reward_completed_task(profile)

        return Response(
            {
                "success": True,
                "message": (
                    f"Tarefa concluída! Você ganhou {rewards['coins_reward']} moedas "
                    f"e {rewards['xp_reward']} XP."
                ),
                "earned_coins": rewards["coins_reward"],
                "xp_gained": rewards["xp_reward"],
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK,
        )
