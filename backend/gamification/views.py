from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import StoreItem, UserInventory, UserProfile
from .serializers import (
    StoreItemSerializer,
    UserInventorySerializer,
    UserProfileSerializer,
    serialize_profile,
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


# =========================================================
# HELPERS
# =========================================================

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
        profile.wood_chest_claimed = False
        profile.silver_chest_claimed = False
        profile.gold_chest_claimed = False
        profile.last_activity = today

        profile.save(update_fields=[
            "today_focus_minutes",
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
    UserInventory.objects.filter(
        user=user,
        item__category=category
    ).update(is_equipped=False)

    inventory = UserInventory.objects.filter(
        user=user,
        item=current_item
    ).first()

    if inventory:
        inventory.is_equipped = True
        inventory.save(update_fields=["is_equipped"])


def apply_level_up(profile):
    """
    Aplica evolução de nível em cascata, se o XP atual ultrapassar
    o XP necessário para o próximo nível.
    """
    while (
        profile.current_xp >= profile.xp_to_next_level
        and profile.xp_to_next_level > 0
    ):
        profile.current_xp -= profile.xp_to_next_level
        profile.level += 1
        profile.xp_to_next_level = max(100, profile.xp_to_next_level + 50)


def chest_required_minutes(goal_minutes, percent):
    return max(1, round(goal_minutes * (percent / 100)))


# =========================================================
# STATUS / DASHBOARD DA GAMIFICAÇÃO
# =========================================================

class GameStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_profile(request.user)

        refresh_daily_progress(profile)

        serializer = UserProfileSerializer(profile)

        return Response(
            {
                "success": True,
                "stats": serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# LISTAGEM DA LOJA
# =========================================================

class StoreItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = StoreItem.objects.all().order_by(
            "category",
            "required_level",
            "price",
            "id"
        )

        serializer = StoreItemSerializer(
            items,
            many=True,
            context={"request": request}
        )

        return Response(
            {
                "success": True,
                "items": serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# INVENTÁRIO DO USUÁRIO
# =========================================================

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
            status=status.HTTP_200_OK
        )


# =========================================================
# COMPRA DE ITEM DA LOJA
# =========================================================

class PurchaseStoreItemView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, item_id):
        profile = get_profile(request.user)
        item = get_object_or_404(StoreItem, id=item_id)

        already_owned = UserInventory.objects.filter(
            user=request.user,
            item=item
        ).exists()

        if already_owned:
            return Response(
                {
                    "success": False,
                    "error": "Você já possui este item."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if profile.level < item.required_level:
            return Response(
                {
                    "success": False,
                    "error": "Seu nível ainda não permite comprar este item."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if profile.coins < item.price:
            return Response(
                {
                    "success": False,
                    "error": "Moedas insuficientes para esta compra."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.coins -= item.price
        profile.save(update_fields=["coins"])

        UserInventory.objects.create(
            user=request.user,
            item=item,
            is_equipped=False
        )

        return Response(
            {
                "success": True,
                "message": f"Item '{item.name}' comprado com sucesso.",
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# EQUIPAR ITEM
# =========================================================

class EquipItemView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, item_id):
        profile = get_profile(request.user)
        item = get_object_or_404(StoreItem, id=item_id)

        inventory = UserInventory.objects.filter(
            user=request.user,
            item=item
        ).first()

        if not inventory:
            return Response(
                {
                    "success": False,
                    "error": "Você precisa comprar este item antes de equipá-lo."
                },
                status=status.HTTP_400_BAD_REQUEST
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
                    "error": "Categoria de item inválida para equipar."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.save()

        ensure_single_equipped_item(
            user=request.user,
            category=item.category,
            current_item=item
        )

        return Response(
            {
                "success": True,
                "message": f"Item '{item.name}' equipado com sucesso.",
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# CONVERSÃO DE MINUTOS DE FOCO EM MOEDAS
# =========================================================

class ConvertFocusMinutesView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        """
        Converte os minutos de foco pendentes em moedas.
        Regra atual: 1 minuto = 1 moeda.
        """
        profile = get_profile(request.user)

        minutes = profile.pending_focus_minutes

        if minutes <= 0:
            return Response(
                {
                    "success": False,
                    "error": "Não há minutos pendentes para converter."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        earned_coins = minutes

        profile.coins += earned_coins
        profile.pending_focus_minutes = 0
        profile.save(update_fields=["coins", "pending_focus_minutes"])

        return Response(
            {
                "success": True,
                "message": f"{earned_coins} moedas adicionadas com sucesso.",
                "earned_coins": earned_coins,
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# REGISTRO MANUAL DE PROGRESSO (SUPORTE/TESTE)
# =========================================================

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

        refresh_daily_progress(profile)

        focus_minutes = int(request.data.get("focus_minutes", 0))
        completed_pomodoro = bool(request.data.get("completed_pomodoro", False))
        completed_task = bool(request.data.get("completed_task", False))

        if focus_minutes < 0:
            return Response(
                {
                    "success": False,
                    "error": "focus_minutes não pode ser negativo."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        xp_gained = focus_minutes

        profile.current_xp += xp_gained
        profile.pending_focus_minutes += focus_minutes
        profile.total_focus_minutes += focus_minutes
        profile.today_focus_minutes += focus_minutes

        if completed_pomodoro:
            profile.total_pomodoros += 1

        if completed_task:
            profile.total_tasks_completed += 1

        apply_level_up(profile)
        profile.save()

        return Response(
            {
                "success": True,
                "message": "Progresso adicionado com sucesso.",
                "xp_gained": xp_gained,
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# RECOMPENSAS EXTRAS
# =========================================================

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
                    "error": "Tipo de baú inválido."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        claimed_field = chest["claimed_field"]
        already_claimed = getattr(profile, claimed_field)

        if already_claimed:
            return Response(
                {
                    "success": False,
                    "error": "Este baú já foi resgatado."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        goal_minutes = max(profile.daily_goal_minutes, 1)
        required_minutes = chest_required_minutes(
            goal_minutes,
            chest["threshold_percent"]
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
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.coins += chest["coins_reward"]
        profile.current_xp += chest["xp_reward"]
        setattr(profile, claimed_field, True)

        apply_level_up(profile)
        profile.save()

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
            status=status.HTTP_200_OK
        )


class CompleteTaskRewardView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile = get_profile(request.user)

        xp_reward = 15
        coins_reward = 10

        profile.total_tasks_completed += 1
        profile.current_xp += xp_reward
        profile.coins += coins_reward

        apply_level_up(profile)
        profile.save()

        return Response(
            {
                "success": True,
                "message": f"Tarefa concluída! Você ganhou {coins_reward} moedas e {xp_reward} XP.",
                "earned_coins": coins_reward,
                "xp_gained": xp_reward,
                "stats": serialize_profile(profile),
            },
            status=status.HTTP_200_OK
        )