from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile, StoreItem, UserInventory
from .serializers import UserProfileSerializer, StoreItemSerializer


DAILY_GOAL_MINUTES = 120


def get_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def apply_xp(profile: UserProfile, xp_amount: int):
    if xp_amount <= 0:
        return

    profile.current_xp += xp_amount

    while profile.current_xp >= profile.xp_to_next_level:
        profile.current_xp -= profile.xp_to_next_level
        profile.level += 1
        profile.xp_to_next_level += 50


def register_today_activity(profile: UserProfile):
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)

    if profile.last_activity == today:
        if profile.streak <= 0:
            profile.streak = 1
        return

    if profile.last_activity == yesterday:
        profile.streak = profile.streak + 1 if profile.streak > 0 else 1
    else:
        profile.streak = 1

    profile.daily_goal_progress = 0
    profile.wood_chest_claimed = False
    profile.silver_chest_claimed = False
    profile.gold_chest_claimed = False


def serialize_profile(profile: UserProfile):
    return UserProfileSerializer(profile).data


class GamificationDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_profile(request.user)
        return Response({"stats": serialize_profile(profile)})


class ConvertFocusPointsView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile = get_profile(request.user)

        try:
            minutes = int(request.data.get("minutes", 0))
        except (TypeError, ValueError):
            return Response(
                {"error": "Minutos inválidos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if minutes <= 0:
            return Response(
                {"error": "Minutos inválidos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        register_today_activity(profile)

        apply_xp(profile, minutes)

        profile.pending_focus_minutes += minutes
        profile.total_pomodoros += 1

        progress_gain = round((minutes / DAILY_GOAL_MINUTES) * 100)
        profile.daily_goal_progress = min(100, profile.daily_goal_progress + progress_gain)

        profile.save()

        return Response({
            "message": f"Você ganhou {minutes} XP e acumulou {minutes} moedas pendentes.",
            "stats": serialize_profile(profile),
        })


class ClaimPendingCoinsView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile = get_profile(request.user)
        pending = profile.pending_focus_minutes

        if pending <= 0:
            return Response(
                {"error": "Não há moedas pendentes para resgatar."},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.coins += pending
        profile.pending_focus_minutes = 0
        profile.save()

        return Response({
            "message": f"{pending} moedas resgatadas com sucesso.",
            "stats": serialize_profile(profile),
        })


class ClaimChestView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, chest_type):
        profile = get_profile(request.user)

        if profile.last_activity != timezone.localdate():
            return Response(
                {"error": "Faça uma sessão de foco hoje para liberar os baús do dia."},
                status=status.HTTP_400_BAD_REQUEST
            )

        chest_rules = {
            "wood": {
                "threshold": 33,
                "reward": 50,
                "field": "wood_chest_claimed",
                "label": "Madeira",
            },
            "silver": {
                "threshold": 66,
                "reward": 100,
                "field": "silver_chest_claimed",
                "label": "Prata",
            },
            "gold": {
                "threshold": 100,
                "reward": 200,
                "field": "gold_chest_claimed",
                "label": "Ouro",
            },
        }

        rule = chest_rules.get(chest_type)
        if not rule:
            return Response(
                {"error": "Tipo de baú inválido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        already_claimed = getattr(profile, rule["field"])
        if already_claimed:
            return Response(
                {"error": "Este baú já foi resgatado hoje."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if profile.daily_goal_progress < rule["threshold"]:
            return Response(
                {"error": "Progresso diário insuficiente para este baú."},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.coins += rule["reward"]
        setattr(profile, rule["field"], True)
        profile.save()

        return Response({
            "message": f"Baú de {rule['label']} resgatado com sucesso.",
            "stats": serialize_profile(profile),
        })


class CompleteTaskRewardView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile = get_profile(request.user)

        register_today_activity(profile)

        xp_reward = 10
        coin_reward = 5

        apply_xp(profile, xp_reward)

        profile.coins += coin_reward
        profile.total_tasks_completed += 1
        profile.save()

        return Response({
            "message": f"Tarefa concluída: +{xp_reward} XP e +{coin_reward} moedas.",
            "stats": serialize_profile(profile),
        })


class StoreListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = StoreItem.objects.all().order_by("required_level", "price", "name")
        serializer = StoreItemSerializer(items, many=True, context={"request": request})
        return Response(serializer.data)


class PurchaseItemView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, item_id):
        profile = get_profile(request.user)
        item = get_object_or_404(StoreItem, id=item_id)

        if profile.level < item.required_level:
            return Response(
                {"error": f"Você precisa estar no nível {item.required_level} para comprar este item."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if UserInventory.objects.filter(user=request.user, item=item).exists():
            return Response(
                {"error": "Você já possui este item."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if profile.coins < item.price:
            return Response(
                {"error": "Moedas insuficientes."},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.coins -= item.price
        profile.save()

        UserInventory.objects.create(user=request.user, item=item)

        return Response({
            "success": True,
            "message": f"Item '{item.name}' comprado com sucesso.",
            "stats": serialize_profile(profile),
        })