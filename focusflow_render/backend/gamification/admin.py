from django.contrib import admin
from .models import UserProfile, StoreItem, UserInventory, Challenge

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'level', 'coins', 'streak', 'daily_goal_progress')
    search_fields = ('user__username',)

@admin.register(StoreItem)
class StoreItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'rarity', 'price', 'required_level')
    list_filter = ('category', 'rarity')

@admin.register(UserInventory)
class UserInventoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'is_equipped', 'purchased_at')
    list_filter = ('is_equipped', 'item__category')

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'xp_reward', 'target_value', 'is_completed', 'expires_at')