from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ("OWNER", "Boutique Owner"),
        ("CUSTOMER", "Customer"),
        ("SUPER_ADMIN", "Super Admin"),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    outlet_id = models.IntegerField(null=True, blank=True)

class Boutique(models.Model):
    outlet_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    owner = models.OneToOneField(User, on_delete=models.CASCADE)

class Product(models.Model):
    outlet_id = models.IntegerField()
    name = models.CharField(max_length=100)
    garment_category = models.IntegerField()
    fabric_type = models.IntegerField()
    price = models.FloatField()
    stock = models.IntegerField()
    image = models.CharField(max_length=800, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('Men', 'Men'), ('Women', 'Women'), ('Unisex', 'Unisex')], default='Unisex')

import uuid

class Purchase(models.Model):
    STATUS_CHOICES = (
        ("Pending", "Pending"),
        ("Confirmed", "Confirmed"),
        ("Packed", "Packed"),
        ("Shipped", "Shipped"),
        ("Out for Delivery", "Out for Delivery"),
        ("Delivered", "Delivered"),
        ("Cancelled", "Cancelled"),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    outlet_id = models.IntegerField()
    quantity = models.IntegerField()
    total_price = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # New Fields for Order Tracking
    order_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    tracking_id = models.CharField(max_length=20, unique=False, blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    status_history = models.JSONField(default=list)

    def save(self, *args, **kwargs):
        if not self.tracking_id:
            self.tracking_id = "TRK-" + uuid.uuid4().hex[:8].upper()
        
        # Auto-append to history if status changes (basic implementation)
        # For a more robust solution, we'd check against DB value, but for now:
        if not self.pk:
            self.status_history.append({
                "status": "Pending", 
                "timestamp": str(self.created_at or timezone.now()),
                "note": "Order Placed"
            })
            
        super().save(*args, **kwargs)

class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
