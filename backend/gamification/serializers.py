from rest_framework import serializers
from .models import UserProfile, StoreItem, UserInventory, Challenge

class UserProfileSerializer(serializers.ModelSerializer):
    # Campos calculados para facilitar a vida do Frontend
    xp_progress_percent = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField() 

    class Meta:
        model = UserProfile
        fields = [
            'username', 'level', 'current_xp', 'xp_to_next_level', 
            'xp_progress_percent', 'coins', 'streak', 
            'pending_focus_minutes', 'daily_goal_progress'
        ]

    def get_xp_progress_percent(self, obj):
        if obj.xp_to_next_level <= 0: 
            return 0
        return (obj.current_xp / obj.xp_to_next_level) * 100

    def get_username(self, obj):
        # 1. Tenta pegar o nome completo (First Name + Last Name) preenchido no Django
        full_name = obj.user.get_full_name().strip()
        if full_name:
            return full_name
            
        # 2. Se não tiver nome cadastrado, pega o username (que pode ser o email)
        username_or_email = obj.user.username or getattr(obj.user, 'email', '')
        
        # 3. Se for um e-mail, corta a parte do domínio (ex: samuel@email.com -> Samuel)
        if '@' in username_or_email:
            name_part = username_or_email.split('@')[0]
            return name_part.capitalize()
            
        return username_or_email.capitalize()


class StoreItemSerializer(serializers.ModelSerializer):
    owned = serializers.SerializerMethodField()
    equipped = serializers.SerializerMethodField()

    class Meta:
        model = StoreItem
        fields = '__all__'

    def get_owned(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return UserInventory.objects.filter(user=request.user, item=obj).exists()

    def get_equipped(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return UserInventory.objects.filter(user=request.user, item=obj, is_equipped=True).exists()


class ChallengeSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = '__all__'

    def get_progress_percent(self, obj):
        if obj.target_value <= 0: 
            return 0
        return (obj.current_value / obj.target_value) * 100