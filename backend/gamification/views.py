from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from .models import UserProfile, StoreItem, UserInventory, Challenge
from .serializers import UserProfileSerializer, StoreItemSerializer

class GamificationDashboardView(APIView):
    """
    Retorna o status atual do usuário (Nível, XP, Moedas, etc).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # O get_or_create garante que, se o usuário não tiver perfil, ele será criado agora.
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        serializer = UserProfileSerializer(profile)
        return Response({"stats": serializer.data})


class ConvertFocusPointsView(APIView):
    """
    Converte os minutos focados no Pomodoro em XP e Moedas.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        # Pega os minutos enviados pelo Frontend (ex: 25 minutos)
        minutes = request.data.get('minutes', 0)
        
        if minutes <= 0:
            return Response({"error": "Minutos inválidos."}, status=status.HTTP_400_BAD_REQUEST)

        # Regra de negócio simples: 1 minuto = 1 XP e 1 Moeda
        profile.current_xp += minutes
        profile.coins += minutes
        profile.total_pomodoros += 1

        # Lógica de Level Up automático
        while profile.current_xp >= profile.xp_to_next_level:
            profile.current_xp -= profile.xp_to_next_level
            profile.level += 1
            profile.xp_to_next_level += 50 

        profile.save()
        
        serializer = UserProfileSerializer(profile)
        return Response({
            "message": f"Você ganhou {minutes} XP e {minutes} Moedas!", 
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


class StoreListView(APIView):
    """
    Lista todos os itens disponíveis na loja.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = StoreItem.objects.all().order_by('required_level', 'price')
        # Passamos o request no context para o serializer checar se o usuário já possui o item
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

        # 1. Verifica Nível
        if profile.level < item.required_level:
            return Response(
                {"error": f"Você precisa estar no Nível {item.required_level} para comprar este item."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Verifica se já possui o item
        if UserInventory.objects.filter(user=request.user, item=item).exists():
            return Response(
                {"error": "Você já possui este item!"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Verifica saldo
        if profile.coins < item.price:
            return Response(
                {"error": "Moedas insuficientes."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Efetua a compra
        profile.coins -= item.price
        profile.save()

        UserInventory.objects.create(user=request.user, item=item)

        return Response({
            "success": True, 
            "message": f"Você comprou '{item.name}' com sucesso!",
            "new_balance": profile.coins
        })