from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
from fastapi.middleware.cors import CORSMiddleware
import os
import math
from datetime import datetime
import sqlite3
import json
import requests

CITY_COORDS = {
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.7041, 77.1025),
    "Bangalore": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Pune": (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873),
    "Surat": (21.1702, 72.8311)
}

import h3

app = FastAPI(title="Amazon Account Sharing Detection API")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = None
MODEL_PATH = "account_sharing_model.pkl"
if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")

def init_db():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS events
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  user_id TEXT, 
                  event_id TEXT, 
                  timestamp TEXT, 
                  event_type TEXT, 
                  ip_address TEXT, 
                  city TEXT, 
                  device TEXT, 
                  device_fingerprint TEXT,
                  is_manual BOOLEAN)''')
    conn.commit()
    conn.close()

init_db()

class Event(BaseModel):
    user_id: str
    event_id: str
    timestamp: str
    event_type: str
    ip_address: str
    city: str
    device: str
    device_fingerprint: str = None
    is_manual: bool = False

@app.post("/ingest")
async def ingest_event(event: Event):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    user_id = event.user_id
    
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute('''INSERT INTO events (user_id, event_id, timestamp, event_type, ip_address, city, device, device_fingerprint, is_manual) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
              (event.user_id, event.event_id, event.timestamp, event.event_type, event.ip_address, event.city, event.device, event.device_fingerprint, event.is_manual))
    conn.commit()
    
    c.execute("SELECT * FROM events WHERE user_id=? ORDER BY timestamp ASC", (user_id,))
    rows = c.fetchall()
    conn.close()
    
    user_history = []
    for r in rows:
        user_history.append({
            'user_id': r[1],
            'event_id': r[2],
            'timestamp': r[3],
            'event_type': r[4],
            'ip_address': r[5],
            'city': r[6],
            'device': r[7],
            'device_fingerprint': r[8]
        })
    
    # Feature Engineering on the fly for this user
    df = pd.DataFrame(user_history)
    
    unique_ips = df['ip_address'].nunique()
    unique_devices = df['device'].nunique()
    unique_cities = df['city'].nunique()
    num_events = len(df)
    
    features = pd.DataFrame([{
        'unique_ips': unique_ips,
        'unique_devices': unique_devices,
        'unique_cities': unique_cities,
        'num_events': num_events
    }])
    
    # Predict Probabilistic Score (ML Engine)
    ml_prob = 0.0
    if hasattr(model, 'predict_proba'):
        ml_prob = model.predict_proba(features)[0][1] # Probability of class 1
    else:
        ml_prob = float(model.predict(features)[0])
    
    ml_score = float(round(ml_prob * 100, 2))
    
    # Mathematical Engine (Deterministic)
    math_score = 0
    
    # Real IP Intelligence (Only for manual sandbox to stay completely free/avoid rate limits)
    real_city = event.city
    is_vpn = event.ip_address.startswith("104.")
    
    if event.is_manual:
        try:
            r = requests.get(f"http://ip-api.com/json/{event.ip_address}?fields=status,city,proxy,hosting", timeout=2)
            if r.status_code == 200:
                data = r.json()
                if data.get("status") == "success":
                    real_city = data.get("city", event.city)
                    is_vpn = data.get("proxy", False) or data.get("hosting", False)
        except Exception as e:
            print(f"IP API Error: {e}")

    if is_vpn:
        math_score += 30
        
    if unique_ips >= 3:
        math_score += 25
        
    device_changed = False
    prev_fingerprint = None
    impossible_travel = None
    
    if len(user_history) > 1:
        prev_event = user_history[-2]
        
        if prev_event.get('device_fingerprint') and event.device_fingerprint and prev_event['device_fingerprint'] != event.device_fingerprint:
            device_changed = True
            prev_fingerprint = prev_event['device_fingerprint']
            math_score += 20
            
        try:
            # Parse timestamps
            t1 = datetime.fromisoformat(prev_event['timestamp'].replace('Z', '+00:00'))
            t2 = datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
            time_diff_hours = abs((t2 - t1).total_seconds()) / 3600.0
            
            c1 = CITY_COORDS.get(prev_event['city'])
            c2 = CITY_COORDS.get(event.city)
            
            if c1 and c2 and prev_event['city'] != event.city:
                h1 = h3.latlng_to_cell(c1[0], c1[1], 4)
                h2 = h3.latlng_to_cell(c2[0], c2[1], 4)
                
                try:
                    grid_dist = h3.grid_distance(h1, h2)
                except Exception:
                    grid_dist = 999  # Fallback if hexes are too far for grid_distance
                    
                speed_hex_h = grid_dist / time_diff_hours if time_diff_hours > 0 else 0
                
                is_impossible = speed_hex_h > 30
                if is_impossible:
                    math_score += 50
                    
                impossible_travel = {
                    "prev_city": prev_event['city'],
                    "distance_hexes": int(grid_dist),
                    "time_diff_mins": float(round(time_diff_hours * 60, 2)),
                    "speed_hex_h": float(round(speed_hex_h, 2)),
                    "is_impossible": bool(is_impossible)
                }
        except Exception as e:
            print(f"Error calculating travel: {e}")
            
    # Cap math score at 100
    math_score = int(min(math_score, 100))
    
    # Fusion Engine
    final_risk_score = float(round((math_score * 0.6) + (ml_score * 0.4), 2))
    is_flagged_shared = bool(final_risk_score >= 75.0)
    
    return {
        "status": "success",
        "user_id": user_id,
        "is_flagged_shared": is_flagged_shared,
        "risk_score": final_risk_score,
        "math_score": math_score,
        "ml_score": ml_score,
        "features_analyzed": num_events,
        "impossible_travel": impossible_travel,
        "is_vpn": is_vpn,
        "device_changed": device_changed,
        "prev_fingerprint": prev_fingerprint
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
