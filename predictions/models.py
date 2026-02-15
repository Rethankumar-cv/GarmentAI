from django.db import models
from django.contrib.auth.models import User

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
    image = models.URLField(max_length=800, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('Men', 'Men'), ('Women', 'Women'), ('Unisex', 'Unisex')], default='Unisex')

class Purchase(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    outlet_id = models.IntegerField()
    quantity = models.IntegerField()
    total_price = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
