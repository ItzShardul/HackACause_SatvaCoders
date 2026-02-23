import requests
import os
from dotenv import load_dotenv

load_dotenv()

def test_google_maps_key(api_key):
    print(f"--- Testing Google Maps API Key: {api_key[:8]}... ---")
    
    # 1. Test Geocoding API (Simplest to test)
    geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?address=Nagpur,Maharashtra&key={api_key}"
    
    try:
        resp = requests.get(geo_url)
        data = resp.json()
        
        status = data.get("status")
        if status == "OK":
            print("✅ Geocoding API: WORKING")
            location = data["results"][0]["geometry"]["location"]
            print(f"   Result: Nagpur found at {location}")
        # 2. Test Directions API
        dir_url = f"https://maps.googleapis.com/maps/api/directions/json?origin=Nagpur&destination=Wardha&key={api_key}"
        resp_dir = requests.get(dir_url)
        data_dir = resp_dir.json()
        status_dir = data_dir.get("status")
        
        if status_dir == "OK":
            print("✅ Directions API: WORKING")
        elif status_dir == "REQUEST_DENIED":
            print(f"❌ Directions API: REQUEST_DENIED - {data_dir.get('error_message')}")
        else:
            print(f"❌ Directions API: FAILED ({status_dir})")
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")

if __name__ == "__main__":
    # Using the key provided by the user directly for this test
    user_key = "AIzaSyAv55Yn2_41pj4wNPjAMFrp2bn5_xwOUMA"
    test_google_maps_key(user_key)
