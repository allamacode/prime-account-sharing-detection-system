import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker('en_IN')

# Configuration
NUM_USERS = 1000
NUM_EVENTS_PER_USER_AVG = 50
PERCENT_SHARED_ACCOUNTS = 0.15 # 15% of accounts are shared

def generate_users():
    print("Generating base user profiles...")
    users = []
    for _ in range(NUM_USERS):
        is_shared = random.random() < PERCENT_SHARED_ACCOUNTS
        user = {
            "user_id": fake.uuid4(),
            "name": fake.name(),
            "primary_city": fake.city(),
            "primary_ip": fake.ipv4(),
            "primary_device": random.choice(["Windows", "Mac", "iOS", "Android"]),
            "is_shared": is_shared
        }
        users.append(user)
    return users

def generate_events(users):
    print("Generating events for users...")
    events = []
    start_date = datetime.now() - timedelta(days=90) # Generate events over the last 90 days

    for user in users:
        num_events = int(np.random.normal(NUM_EVENTS_PER_USER_AVG, 10))
        num_events = max(5, num_events) # Minimum 5 events
        
        # If shared, define a secondary user profile secretly using the same account
        secondary_city = fake.city() if user["is_shared"] else None
        secondary_ip = fake.ipv4() if user["is_shared"] else None
        secondary_device = random.choice(["Windows", "Mac", "iOS", "Android"]) if user["is_shared"] else None
        
        for _ in range(num_events):
            event_date = start_date + timedelta(days=random.uniform(0, 90))
            
            # Determine if this specific event is from the primary or secondary person
            is_secondary_event = user["is_shared"] and random.random() < 0.4
            
            if is_secondary_event:
                current_city = secondary_city
                current_ip = secondary_ip
                current_device = secondary_device
            else:
                # Normal minor variations (e.g. dynamic IP, mobile network)
                current_city = user["primary_city"]
                current_ip = user["primary_ip"] if random.random() < 0.8 else fake.ipv4()
                current_device = user["primary_device"]

            event = {
                "event_id": fake.uuid4(),
                "user_id": user["user_id"],
                "timestamp": event_date,
                "event_type": random.choices(["login", "view_item", "add_to_cart", "purchase"], weights=[0.2, 0.5, 0.2, 0.1])[0],
                "ip_address": current_ip,
                "city": current_city,
                "device": current_device,
                "is_shared_label": user["is_shared"] # Target label for ML
            }
            events.append(event)
            
    return pd.DataFrame(events)

if __name__ == "__main__":
    users = generate_users()
    df = generate_events(users)
    
    # Sort by timestamp
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    
    print(f"Generated {len(df)} events.")
    print(df.head())
    
    df.to_csv("simulated_events.csv", index=False)
    print("Saved to simulated_events.csv")
