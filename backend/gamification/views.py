from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import UserProfile, StoreItem, UserInventory, Challenge
from .serializers import UserProfileSerializer, StoreItemSerializer

class GamificationDashboardView(APIView):
    """
    Retorna o status atual do usuário (Nível, XP, Moedas, etc).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response({"stats": serializer.data})


class ConvertFocusPointsView(APIView):
    """
    Chamada AUTOMÁTICA pelo Pomodoro. Dá o XP na hora e deixa as moedas pendentes.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        minutes = request.data.get('minutes', 0)
        
        if minutes <= 0:
            return Response({"error": "Minutos inválidos."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. XP AUTOMÁTICO IMEDIATO
        profile.current_xp += minutes

        # Lógica de Level Up (Escadinha Suave de 50)
        while profile.current_xp >= profile.xp_to_next_level:
            profile.current_xp -= profile.xp_to_next_level
            profile.level += 1
            profile.xp_to_next_level += 50

        # 2. MOEDAS PENDENTES (Para resgate manual)
        profile.pending_focus_minutes += minutes

        profile.save()
        
        serializer = UserProfileSerializer(profile)
        return Response({
            "message": f"Ganhaste {minutes} XP! Tens {minutes} moedas aguardando resgate.", 
            "stats": serializer.data
        })


class ClaimPendingCoinsView(APIView):
    """
    Chamada MANUAL pelo utilizador no Dashboard para sacar as moedas.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        pending = profile.pending_focus_minutes
        
        if pending <= 0:
            return Response({"error": "Não tens moedas pendentes para resgatar."}, status=status.HTTP_400_BAD_REQUEST)

        # Transfere o pendente para a carteira real e zera o saldo pendente
        profile.coins += pending
        profile.pending_focus_minutes = 0

        profile.save()
        
        serializer = UserProfileSerializer(profile)
        return Response({
            "message": f"Resgataste {pending} moedas com sucesso!", 
            "stats": serializer.data
        })


class ClaimChestView(APIView):
    """
    Resgata baús diários de recompensa.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, chest_type):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if chest_type == 'wood' and not profile.wood_chest_claimed:
            profile.coins += 50
            profile.wood_chest_claimed = True
        elif chest_type == 'silver' and not profile.silver_chest_claimed:
            profile.coins += 100
            profile.silver_chest_claimed = True
        elif chest_type == 'gold' and not profile.gold_chest_claimed:
            profile.coins += 200
            profile.gold_chest_claimed = True
        else:
            return Response(
                {"error": "Baú já resgatado ou tipo de baú inválido."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        profile.save()
        serializer = UserProfileSerializer(profile)
        return Response({
            "message": f"Baú de {chest_type} resgatado com sucesso!", 
            "stats": serializer.data
        })


class CompleteTaskRewardView(APIView):
    """
    Dá XP e Moedas quando o utilizador conclui uma tarefa.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        xp_reward = 10
        coin_reward = 5
        
        profile.current_xp += xp_reward
        profile.coins += coin_reward
        
        # Lógica de Level Up (Escadinha Suave)
        while profile.current_xp >= profile.xp_to_next_level:
            profile.current_xp -= profile.xp_to_next_level
            profile.level += 1
            profile.xp_to_next_level += 50
            
        profile.save()
        
        return Response({
            "message": f"Boa! Ganhaste {xp_reward} XP e {coin_reward} Moedas por concluíres a tarefa.",
            "xp": xp_reward,
            "coins": coin_reward
        })


class StoreListView(APIView):
    """
    Lista todos os itens disponíveis na loja.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = StoreItem.objects.all().order_by('required_level', 'price')
        serializer = StoreItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)


class PurchaseItemView(APIView):
    """
    Lógica para comprar um item da loja.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, item_id):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        item = get_object_or_404(StoreItem, id=item_id)

        if profile.level < item.required_level:
            return Response(
                {"error": f"Você precisa estar no Nível {item.required_level} para comprar este item."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if UserInventory.objects.filter(user=request.user, item=item).exists():
            return Response(
                {"error": "Você já possui este item!"}, 
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
            "message": f"Você comprou '{item.name}' com sucesso!",
            "new_balance": profile.coins
        })