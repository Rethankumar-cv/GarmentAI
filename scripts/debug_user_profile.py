
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GarmentAI.settings')
django.setup()

from django.contrib.auth.models import User
from predictions.models import UserProfile

def check_owners():
    owners = UserProfile.objects.filter(role='OWNER')
    print(f"Found {owners.count()} owners.")
    for profile in owners:
        print(f"User: {profile.user.username}, Outlet ID: {profile.outlet_id}")

if __name__ == '__main__':
    check_owners()
