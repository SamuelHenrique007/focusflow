from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import override_settings

from gamification.models import StoreItem, UserInventory, UserProfile

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class GamificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="samuel@email.com",
            email="samuel@email.com",
            password="SenhaForte@123",
            name="Samuel",
        )

        login_response = self.client.post(
            "/api/auth/login/",
            {
                "email": "samuel@email.com",
                "password": "SenhaForte@123",
            },
            format="json",
        )
        token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        self.profile.level = 5
        self.profile.coins = 500
        self.profile.save()

        self.item = StoreItem.objects.create(
            name="Avatar Ninja",
            description="Avatar raro",
            category="avatar",
            rarity="Raro",
            price=100,
            visual_resource="ninja",
            required_level=1,
        )

    def test_game_status_creates_and_returns_stats(self):
        response = self.client.get("/api/gamification/status/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("stats", response.data)

    def test_purchase_store_item(self):
        response = self.client.post(f"/api/gamification/store/{self.item.id}/purchase/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            UserInventory.objects.filter(user=self.user, item=self.item).exists()
        )

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.coins, 400)

    def test_equip_owned_item(self):
        UserInventory.objects.create(user=self.user, item=self.item, is_equipped=False)

        response = self.client.post(f"/api/gamification/store/{self.item.id}/equip/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.equipped_avatar_item, self.item)

    def test_cannot_purchase_item_without_coins(self):
        self.profile.coins = 0
        self.profile.save(update_fields=["coins"])

        response = self.client.post(f"/api/gamification/store/{self.item.id}/purchase/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            UserInventory.objects.filter(user=self.user, item=self.item).exists()
        )