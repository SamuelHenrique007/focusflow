from django.urls import path
from .views import (
    GamificationDashboardView, 
    ConvertFocusPointsView, 
    ClaimChestView,
    StoreListView,
    PurchaseItemView
)

urlpatterns = [
    # Status Geral (Sidebar/Header/Dashboard)
    path('status/', GamificationDashboardView.as_view(), name='game-status'),
    
    # Loja e Inventário
    path('store/items/', StoreListView.as_view(), name='store-list'),
    path('store/purchase/<int:item_id>/', PurchaseItemView.as_view(), name='store-purchase'),
    
    # Ações de Gamificação
    path('actions/convert-focus/', ConvertFocusPointsView.as_view(), name='convert-focus'),
    path('actions/claim-chest/<str:chest_type>/', ClaimChestView.as_view(), name='claim-chest'),
]