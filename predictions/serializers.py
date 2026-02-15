from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Boutique, Product, Purchase, Cart

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'role', 'outlet_id']

class BoutiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Boutique
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['outlet_id']

class PurchaseSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.URLField(source='product.image', read_only=True)
    
    class Meta:
        model = Purchase
        fields = ['id', 'customer', 'product', 'product_name', 'product_image', 'outlet_id', 'quantity', 'total_price', 'created_at']

class CartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    price = serializers.FloatField(source='product.price', read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'product', 'product_name', 'price', 'quantity']
        read_only_fields = ['user']
