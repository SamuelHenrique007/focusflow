from django.urls import path
from .views import (
    GamificationDashboardView, 
    ConvertFocusPointsView, 
    ClaimPendingCoinsView, 
    ClaimChestView, 
    StoreListView, 
    PurchaseItemView,
    CompleteTaskRewardView
)

urlpatterns = [
    path('status/', GamificationDashboardView.as_view(), name='gamification-status'),
    path('actions/convert-focus/', ConvertFocusPointsView.as_view(), name='convert-focus'),
    path('actions/claim-coins/', ClaimPendingCoinsView.as_view(), name='claim-coins'),
    path('actions/claim-chest/<str:chest_type>/', ClaimChestView.as_view(), name='claim-chest'),
    path('store/', StoreListView.as_view(), name='store-list'),
    path('store/<int:item_id>/purchase/', PurchaseItemView.as_view(), name='store-purchase'),
    path('actions/complete-task/', CompleteTaskRewardView.as_view(), name='complete-task'),
]