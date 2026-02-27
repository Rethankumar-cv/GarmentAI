import os
import django
import sys
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "GarmentAI.settings")
django.setup()

from django.contrib.auth.models import User
from predictions.models import UserProfile, Boutique, Product, Purchase
import random
import string
from rest_framework.test import APIRequestFactory, force_authenticate
from predictions.api_views import OwnerDashboardAPIView

username = 'test_' + ''.join(random.choices(string.ascii_lowercase, k=4))
fake_outlet = random.randint(1000, 90000)

user = User.objects.create_user(username=username, password="Password123!")
UserProfile.objects.create(user=user, role="OWNER", outlet_id=fake_outlet)
boutique = Boutique.objects.create(name="My Shop", outlet_id=fake_outlet, owner=user)

# Add a fake product
product = Product.objects.create(
    name="Test Product", price=19.99, stock=5,
    outlet_id=fake_outlet, fabric_type=0, garment_category=1
)

# Add a fake purchase to trigger the "Real Data Logic" block
Purchase.objects.create(
    customer=user, product=product, outlet_id=fake_outlet,
    quantity=2, total_price=39.98
)

factory = APIRequestFactory()
request = factory.get('/api/dashboard/owner/')
force_authenticate(request, user=user)

view = OwnerDashboardAPIView.as_view()

print(f"Testing Dashboard for {username} with 1 purchase...")
try:
    response = view(request)
    print(f"Status: {response.status_code}")
    print("Data:", response.data)
except Exception as e:
    traceback.print_exc()

