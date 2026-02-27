import requests
import json

base_url = "http://127.0.0.1:8000/api"

# 1. Login to get token
login_res = requests.post(
    f"{base_url}/auth/login/", 
    json={"username": "user_colxwvpl", "password": "Password123!"}
)
try:
    token = login_res.json()['tokens']['access']
    print("Login successful.")
except Exception as e:
    print(f"Login failed: {login_res.text}")
    exit(1)

# 2. Make prediction request
headers = {"Authorization": f"Bearer {token}"}
payload = {
    "stockcode": "85123A",
    "price": 2.55,
    "fabric_type": "Cotton",
    "garment_category": "Shirts",
    "outlet_id": 1
}

print("Sending prediction request...")
res = requests.post(f"{base_url}/predict/", headers=headers, json=payload)
print(f"Status Code: {res.status_code}")
print("Response JSON:")
print(json.dumps(res.json(), indent=2))
