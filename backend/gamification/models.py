from django.db import models
from django.conf import settings  # Importe o settings aqui
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class UserProfile(models.Model):
    # Alterado de User para settings.AUTH_USER_MODEL
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='userprofile'
    )
    
    # Identidade e Nível
    level = models.IntegerField(default=1)
    current_xp = models.IntegerField(default=0)
    xp_to_next_level = models.IntegerField(default=100)
    
    # Economia
    coins = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    pending_focus_minutes = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Estatísticas
    streak = models.IntegerField(default=0)
    total_pomodoros = models.IntegerField(default=0)
    total_tasks_completed = models.IntegerField(default=0)
    last_activity = models.DateField(auto_now=True)

    # Progresso Diário e Baús
    daily_goal_progress = models.IntegerField(
        default=0, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    wood_chest_claimed = models.BooleanField(default=False)
    silver_chest_claimed = models.BooleanField(default=False)
    gold_chest_claimed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - Lvl {self.level}"

class StoreItem(models.Model):
    CATEGORY_CHOICES = [
        ('avatar', 'Avatar'),
        ('theme', 'Tema'),
        ('sound', 'Som'),
    ]
    RARITY_CHOICES = [
        ('Comum', 'Comum'),
        ('Raro', 'Raro'),
        ('Épico', 'Épico'),
        ('Lendário', 'Lendário'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='Comum')
    price = models.IntegerField(default=0)
    visual_resource = models.CharField(max_length=100, help_text="Emoji ou nome do ícone")
    required_level = models.IntegerField(default=1)

    def __str__(self):
        return f"[{self.category}] {self.name}"

class UserInventory(models.Model):
    # Alterado de User para settings.AUTH_USER_MODEL
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='inventory'
    )
    item = models.ForeignKey(StoreItem, on_delete=models.CASCADE)
    is_equipped = models.BooleanField(default=False)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'item')

class Challenge(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    xp_reward = models.IntegerField()
    coin_reward = models.IntegerField(default=0)
    target_value = models.IntegerField()
    current_value = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    expires_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title