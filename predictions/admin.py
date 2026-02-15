from django.contrib import admin

from .models import UserProfile, Boutique, Product, Purchase, Cart

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'outlet_id')
    search_fields = ('user__username', 'user__email', 'role')
    list_filter = ('role',)

@admin.register(Boutique)
class BoutiqueAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'owner', 'outlet_id')
    search_fields = ('name', 'city', 'owner__username')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'outlet_id', 'garment_category', 'price', 'stock', 'gender')
    search_fields = ('name', 'description')
    list_filter = ('gender', 'garment_category')

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('customer', 'product', 'quantity', 'total_price', 'created_at')
    list_filter = ('created_at',)
    date_hierarchy = 'created_at'

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'quantity', 'created_at')
