import requests
import random
import string

BASE_URL = "http://127.0.0.1:8000/api"

def get_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

username = f"user_{get_random_string()}"
password = "testpassword123"
email = f"{username}@example.com"

print(f"Attempting to register user: {username}")

# 1. Register
try:
    reg_resp = requests.post(f"{BASE_URL}/auth/register/", json={
        "username": username,
        "password": password,
        "email": email,
        "role": "OWNER",
        "outlet_id": random.randint(100, 999), 
        "boutique_name": f"Boutique {username}",
        "city": "Test City"
    })
    print(f"Register Status: {reg_resp.status_code}")
    print(f"Register Response: {reg_resp.text}")
except Exception as e:
    print(f"Registration failed to connect: {e}")

# 2. Login
print(f"\nAttempting to login user: {username}")
try:
    login_resp = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": username,
        "password": password
    })
    print(f"Login Status: {login_resp.status_code}")
    print(f"Login Response: {login_resp.text}")
except Exception as e:
    print(f"Login failed to connect: {e}")
