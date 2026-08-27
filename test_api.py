import requests
import uuid
from datetime import datetime

API_URL = "http://localhost:8000/ingest"

def send_event(user_id, ip_address, city, device):
    event = {
        "user_id": user_id,
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "event_type": "login",
        "ip_address": ip_address,
        "city": city,
        "device": device
    }
    try:
        response = requests.post(API_URL, json=event)
        result = response.json()
        status = "FLAGGED AS SHARED" if result.get("is_flagged_shared") else "Normal"
        print(f"Sent {city} ({device}, {ip_address}) -> Model Result: {status} (Features Analyzed: {result.get('features_analyzed')})")
    except Exception as e:
        print(f"Failed to connect to API: {e}")

print("--- TESTING NORMAL USER ---")
# A normal user logs in multiple times from the same city/device/IP
normal_user = str(uuid.uuid4())
send_event(normal_user, "49.36.15.1", "Mumbai", "Android")
send_event(normal_user, "49.36.15.1", "Mumbai", "Android")
send_event(normal_user, "49.36.15.2", "Mumbai", "Android") # slight IP change (mobile network)
send_event(normal_user, "49.36.15.1", "Mumbai", "Android")

print("\n--- TESTING SHARED ACCOUNT ---")
# A shared account has logins from completely different cities, IPs, and devices
shared_user = str(uuid.uuid4())
send_event(shared_user, "103.25.45.1", "Delhi", "Windows")
send_event(shared_user, "27.10.12.5", "Bangalore", "Mac")
send_event(shared_user, "115.110.10.2", "Chennai", "iOS")
send_event(shared_user, "49.200.15.3", "Pune", "Android")
