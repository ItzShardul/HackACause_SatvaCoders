import httpx
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()

async def test_visual_crossing():
    api_key = os.getenv("VISUAL_CROSSING_API_KEY")
    print(f"Testing Visual Crossing with key: {api_key[:5]}...")
    url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Yavatmal/2024-01-01/2024-01-07"
    params = {"key": api_key, "unitGroup": "metric", "contentType": "json"}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                print("✅ Visual Crossing: SUCCESS")
                return True
            else:
                print(f"❌ Visual Crossing: FAILED ({resp.status_code}) - {resp.text[:100]}")
                return False
        except Exception as e:
            print(f"❌ Visual Crossing: ERROR - {str(e)}")
            return False

async def test_weather_api():
    api_key = os.getenv("WEATHER_API_KEY")
    print(f"Testing WeatherAPI.com with key: {api_key[:5]}...")
    url = "https://api.weatherapi.com/v1/current.json"
    params = {"key": api_key, "q": "Yavatmal"}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                print("✅ WeatherAPI.com: SUCCESS")
                return True
            else:
                print(f"❌ WeatherAPI.com: FAILED ({resp.status_code}) - {resp.text[:100]}")
                return False
        except Exception as e:
            print(f"❌ WeatherAPI.com: ERROR - {str(e)}")
            return False

async def main():
    print("--- API KEY VALIDATION ---")
    vc_ok = await test_visual_crossing()
    wa_ok = await test_weather_api()
    print("--------------------------")
    if vc_ok and wa_ok:
        print("🎉 Both API keys are working perfectly!")
    else:
        print("⚠️ One or more keys failed validation.")

if __name__ == "__main__":
    asyncio.run(main())
