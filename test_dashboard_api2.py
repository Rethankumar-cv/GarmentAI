import requests
import random
import string

BASE_URL = "http://127.0.0.1:8000/api"
username = 'user_' + ''.join(random.choices(string.ascii_lowercase, k=8))
password = 'Password123!'

print(f"Registering {username}...")
reg_res = requests.post(f"{BASE_URL}/auth/register/", json={
    "username": username, "password": password, 
    "email": f"{username}@example.com", "role": "OWNER", "outlet_id": random.randint(100, 10000),
    "boutique_name": "Test Boutique", "city": "Test City"
})
print("Reg status:", reg_res.status_code, reg_res.text)

login_res = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": username, "password": password
}).json()

if 'tokens' not in login_res:
    print("Login failed:", login_res)
    exit(1)

token = login_res['tokens']['access']

print("Sending dashboard request to /dashboard/owner/ ...")
res = requests.get(
    f"{BASE_URL}/dashboard/owner/", 
    headers={"Authorization": f"Bearer {token}"}
)
print(f"Status: {res.status_code}")
print("Response:", res.text)

print("\nSending dashboard request to /owner/dashboard/ ...")
res2 = requests.get(
    f"{BASE_URL}/owner/dashboard/", 
    headers={"Authorization": f"Bearer {token}"}
)
print(f"Status: {res2.status_code}")
print("Response:", res2.text)
