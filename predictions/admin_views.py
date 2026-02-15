from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from .models import UserProfile, Product, Purchase, Boutique
from django.db.models import Sum, Count
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or 
            (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'SUPER_ADMIN')
        )

class AdminLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)

        if user:
            # Check if user is super admin
            is_admin = user.is_superuser or (hasattr(user, 'userprofile') and user.userprofile.role == 'SUPER_ADMIN')
            
            if is_admin:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'username': user.username,
                    'role': 'SUPER_ADMIN'
                })
            else:
                return Response({'error': 'Unauthorized. Admin access only.'}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class AdminDashboardStatsAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        total_users = User.objects.count()
        total_products = Product.objects.count()
        total_orders = Purchase.objects.count()
        total_revenue = Purchase.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0
        
        # Recent activity
        recent_orders = Purchase.objects.order_by('-created_at')[:5].values(
            'id', 'customer__username', 'product__name', 'total_price', 'created_at'
        )

        return Response({
            'total_users': total_users,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'recent_orders': list(recent_orders)
        })


# User Views
class AdminUserListAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        users = User.objects.all().select_related('userprofile').order_by('-date_joined')
        data = []
        for u in users:
            role = 'Unknown'
            if hasattr(u, 'userprofile'):
                role = u.userprofile.role
            elif u.is_superuser:
                role = 'SUPER_ADMIN'
                
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'role': role,
                'date_joined': u.date_joined,
                'is_active': u.is_active
            })
        return Response(data)

class AdminUserDetailAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            data = request.data
            
            # Update Active Status
            if 'is_active' in data:
                user.is_active = data['is_active']
                user.save()

            # Update Role
            if 'role' in data and hasattr(user, 'userprofile'):
                user.userprofile.role = data['role']
                user.userprofile.save()
            
            return Response({'status': 'User updated successfully'})
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.is_superuser:
                 return Response({'error': 'Cannot delete superuser'}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

# Product Views
class AdminProductListAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        products = Product.objects.all().order_by('-id')
        return Response(list(products.values()))

    def post(self, request):
        data = request.data
        try:
            product = Product.objects.create(
                name=data['name'],
                price=data['price'],
                stock=data['stock'],
                garment_category=data.get('garment_category', 1), # Default or mapped
                fabric_type=data.get('fabric_type', 1), # Default or mapped
                outlet_id=data.get('outlet_id', 1), # Default
                image=data.get('image', ''),
                description=data.get('description', ''),
                gender=data.get('gender', 'Unisex')
            )
            return Response({'id': product.id, 'message': 'Product created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AdminProductDetailAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            # Manual serialization for simplicity or use serializer if available
            data = {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "stock": product.stock,
                "garment_category": product.garment_category,
                "fabric_type": product.fabric_type,
                "outlet_id": product.outlet_id,
                "image": product.image,
                "description": product.description,
                "gender": product.gender
            }
            return Response(data)
        except Product.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            data = request.data
            
            product.name = data.get('name', product.name)
            product.price = data.get('price', product.price)
            product.stock = data.get('stock', product.stock)
            product.image = data.get('image', product.image)
            product.description = data.get('description', product.description)
            product.gender = data.get('gender', product.gender)
            if 'garment_category' in data: product.garment_category = data['garment_category']
            if 'fabric_type' in data: product.fabric_type = data['fabric_type']
            
            product.save()
            return Response({'message': 'Product updated successfully'})
        except Product.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Product.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

# Order Views
class AdminOrderListAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        purchases = Purchase.objects.all().order_by('-created_at')
        data = []
        for p in purchases:
            data.append({
                'id': p.id,
                'customer': p.customer.username,
                'product': p.product.name,
                'quantity': p.quantity,
                'total_price': p.total_price,
                'date': p.created_at
            })
        return Response(data)

class AdminOrderDetailAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, pk):
        try:
            purchase = Purchase.objects.get(pk=pk)
            purchase.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Purchase.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
