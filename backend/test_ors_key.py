import requests
import os
from dotenv import load_dotenv

load_dotenv()

def test_ors_key():
    api_key = os.getenv("OPENROUTE_SERVICE_KEY")
    print(f"--- Testing OpenRouteService API Key: {api_key[:10]}... ---")
    
    # Coordinates for Nagpur to Wardha (roughly)
    # ORS format is [longitude, latitude]
    start = "79.0882,21.1458"
    end = "78.6022,20.7453"
    
    url = f"https://api.openrouteservice.org/v2/directions/driving-car?api_key={api_key}&start={start}&end={end}"
    
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            dist = data['features'][0]['properties']['summary']['distance'] / 1000
            print(f"✅ OpenRouteService: WORKING")
            print(f"   Nagpur to Wardha Road Distance: {dist:.2f} km")
        else:
            print(f"❌ OpenRouteService: FAILED ({resp.status_code})")
            print(f"   Detail: {resp.text}")
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")

if __name__ == "__main__":
    test_ors_key()
