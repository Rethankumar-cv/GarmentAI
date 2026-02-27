import requests
import random
import string
import json

BASE_URL = "http://127.0.0.1:8000/api"
username = 'user_' + ''.join(random.choices(string.ascii_lowercase, k=8))
password = 'Password123!'

print(f"Registering {username}...")
requests.post(f"{BASE_URL}/auth/register/", json={
    "username": username, "password": password, 
    "email": f"{username}@example.com", "role": "OWNER", "outlet_id": 99
})

print("Logging in...")
login_res = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": username, "password": password
}).json()

if 'tokens' not in login_res:
    print("Login failed:", login_res)
    exit(1)

token = login_res['tokens']['access']

print("Sending dashboard request...")
res = requests.get(
    f"{BASE_URL}/owner/dashboard/", 
    headers={"Authorization": f"Bearer {token}"}
)

print(f"Status: {res.status_code}")
print("Response:", res.text[:2000])
