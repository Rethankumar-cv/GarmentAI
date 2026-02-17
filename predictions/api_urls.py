from django.urls import path
from .api_views import (
    LoginAPIView, RegisterAPIView, PredictSalesAPIView, 
    OwnerDashboardAPIView, ProductListCreateAPIView, ProductDetailAPIView,
    UserDetailAPIView, CartAPIView, CheckoutAPIView, PurchaseListCreateAPIView,
    InventoryAnalyticsAPIView,
    DecisionSupportAPIView, SmartRecommendationsAPIView,
    SalesPatternsAPIView, GeoMapAPIView,
    ReportExportAPIView,
    CustomerOrderListView, OwnerOrderListView, OwnerOrderUpdateView
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .admin_views import (
    AdminLoginAPIView, AdminDashboardStatsAPIView, 
    AdminUserListAPIView, AdminUserDetailAPIView,
    AdminProductListAPIView, AdminProductDetailAPIView,
    AdminOrderListAPIView, AdminOrderDetailAPIView
)

urlpatterns = [
    path('auth/login/', LoginAPIView.as_view(), name='api_login'),
    path('auth/register/', RegisterAPIView.as_view(), name='api_register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserDetailAPIView.as_view(), name='api_user_detail'),
    
    path('predict/', PredictSalesAPIView.as_view(), name='api_predict'),
    path('dashboard/owner/', OwnerDashboardAPIView.as_view(), name='api_owner_dashboard'),
    path('owner/inventory-analytics/', InventoryAnalyticsAPIView.as_view(), name='api_inventory_analytics'),
    path('owner/decision-support/', DecisionSupportAPIView.as_view(), name='api_decision_support'),
    path('owner/smart-recommendations/', SmartRecommendationsAPIView.as_view(), name='api_smart_recommendations'),
    path('owner/sales-patterns/', SalesPatternsAPIView.as_view(), name='api_sales_patterns'),
    path('owner/geo-map/', GeoMapAPIView.as_view(), name='api_geo_map'),
    path('owner/export-report/', ReportExportAPIView.as_view(), name='api_export_report'),
    
    # Order Management
    path('owner/orders/', OwnerOrderListView.as_view(), name='owner_orders'),
    path('owner/orders/<int:pk>/', OwnerOrderUpdateView.as_view(), name='owner_order_update'),
    path('customer/orders/', CustomerOrderListView.as_view(), name='customer_orders'),

    path('products/', ProductListCreateAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('cart/', CartAPIView.as_view(), name='cart'),
    path('checkout/', CheckoutAPIView.as_view(), name='checkout'),
    path('purchase/', PurchaseListCreateAPIView.as_view(), name='api_purchase'),

    # Admin APIs
    path('admin/login/', AdminLoginAPIView.as_view(), name='admin_login'),
    path('admin/stats/', AdminDashboardStatsAPIView.as_view(), name='admin_stats'),
    path('admin/users/', AdminUserListAPIView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/', AdminUserDetailAPIView.as_view(), name='admin_user_detail'),
    path('admin/products/', AdminProductListAPIView.as_view(), name='admin_products'),
    path('admin/products/<int:pk>/', AdminProductDetailAPIView.as_view(), name='admin_product_detail'),
    path('admin/orders/', AdminOrderListAPIView.as_view(), name='admin_orders'),
    path('admin/orders/<int:pk>/', AdminOrderDetailAPIView.as_view(), name='admin_order_detail'),
]
