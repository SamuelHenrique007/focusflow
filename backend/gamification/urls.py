from django.urls import path
from .views import (
    GameStatusView,
    StoreItemListView,
    UserInventoryView,
    PurchaseStoreItemView,
    EquipItemView,
    ConvertFocusMinutesView,
    AddProgressView,
    ClaimChestView,
    CompleteTaskRewardView,
)
urlpatterns = [
    path("status/", GameStatusView.as_view(), name="gamification-status"),
    path("store/", StoreItemListView.as_view(), name="store-list"),
    path("inventory/", UserInventoryView.as_view(), name="inventory-list"),
    path("store/<int:item_id>/purchase/", PurchaseStoreItemView.as_view(), name="store-purchase"),
    path("store/<int:item_id>/equip/", EquipItemView.as_view(), name="store-equip"),
    path("convert-focus-minutes/", ConvertFocusMinutesView.as_view(), name="convert-focus-minutes"),
    path("add-progress/", AddProgressView.as_view(), name="add-progress"),
    path("claim-chest/<str:chest_type>/", ClaimChestView.as_view(), name="claim-chest"),
    path("complete-task-reward/", CompleteTaskRewardView.as_view(), name="complete-task-reward"),
]