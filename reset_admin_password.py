
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GarmentAI.settings')
django.setup()

User = get_user_model()
username = 'admin'
password = 'Admin123!'

try:
    u = User.objects.get(username=username)
    u.set_password(password)
    u.save()
    print(f"Password for {username} set to {password}")
except User.DoesNotExist:
    User.objects.create_superuser(username, 'admin@example.com', password)
    print(f"Created superuser {username} with password {password}")
