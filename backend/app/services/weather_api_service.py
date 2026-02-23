"""
WeatherAPI.com Service — Bulk Multi-Location Fast Polling
FREE tier: 1,000,000 calls/month | API key required (free signup)
Specialty: Fetch all Vidarbha districts simultaneously, air quality, alerts
Sign up: https://www.weatherapi.com/signup.aspx
"""
import httpx
from typing import Dict, List
import os
import asyncio

API_KEY = os.getenv("WEATHER_API_KEY", "YOUR_FREE_KEY_HERE")
BASE_URL = "https://api.weatherapi.com/v1"

VIDARBHA_DISTRICTS = [
    "Yavatmal,Maharashtra", "Akola,Maharashtra", "Washim,Maharashtra",
    "Buldhana,Maharashtra", "Amravati,Maharashtra", "Nagpur,Maharashtra",
    "Wardha,Maharashtra", "Chandrapur,Maharashtra", "Bhandara,Maharashtra",
    "Gondia,Maharashtra", "Gadchiroli,Maharashtra",
]


async def get_current_all_districts() -> Dict[str, Dict]:
    """
    Fetch current weather for ALL 11 Vidarbha districts simultaneously.
    Specialty: Bulk parallel queries — entire Vidarbha in one sweep.
    """
    if API_KEY == "YOUR_FREE_KEY_HERE":
        return {
            "error": "WeatherAPI key not set",
            "signup": "https://www.weatherapi.com/signup.aspx",
            "env_var": "WEATHER_API_KEY",
        }

    results = {}

    async def fetch_one(district_query: str):
        district_name = district_query.split(",")[0]
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{BASE_URL}/current.json",
                    params={"key": API_KEY, "q": district_query, "aqi": "yes"}
                )
                resp.raise_for_status()
                data = resp.json()

            current = data.get("current", {})
            location = data.get("location", {})
            air_quality = current.get("air_quality", {})

            results[district_name] = {
                "district": district_name,
                "source": "weatherapi",
                "specialty": "real-time bulk + air quality",
                "temp_c": current.get("temp_c"),
                "humidity_pct": current.get("humidity"),
                "rainfall_mm_today": current.get("precip_mm", 0),
                "wind_kph": current.get("wind_kph"),
                "condition": current.get("condition", {}).get("text", ""),
                "uv_index": current.get("uv"),
                "air_quality_pm25": air_quality.get("pm2_5"),
                "air_quality_index": air_quality.get("us-epa-index"),
                "dust_storm_risk": "high" if (air_quality.get("pm2_5") or 0) > 150 else "low",
                "feels_like_c": current.get("feelslike_c"),
                "local_time": location.get("localtime"),
            }
        except Exception as e:
            results[district_name] = {"district": district_name, "error": str(e)}

    # Fetch all districts in parallel
    await asyncio.gather(*[fetch_one(d) for d in VIDARBHA_DISTRICTS])
    return results


async def get_forecast_district(district: str, days: int = 7) -> Dict:
    """
    Get 7-day detailed forecast for a single district.
    Includes hourly breakdown — useful for tanker scheduling.
    """
    if API_KEY == "YOUR_FREE_KEY_HERE":
        return {"error": "WeatherAPI key not set", "signup": "https://www.weatherapi.com/signup.aspx"}

    query = f"{district},Maharashtra"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BASE_URL}/forecast.json",
            params={"key": API_KEY, "q": query, "days": days, "aqi": "yes", "alerts": "yes"}
        )
        resp.raise_for_status()
        data = resp.json()

    alerts = data.get("alerts", {}).get("alert", [])
    forecast_days = data.get("forecast", {}).get("forecastday", [])

    daily_summary = []
    for day in forecast_days:
        d = day.get("day", {})
        daily_summary.append({
            "date": day["date"],
            "rainfall_mm": d.get("totalprecip_mm", 0),
            "max_temp_c": d.get("maxtemp_c"),
            "humidity_pct": d.get("avghumidity"),
            "rain_chance_pct": d.get("daily_chance_of_rain", 0),
            "condition": d.get("condition", {}).get("text", ""),
            "uv_index": d.get("uv"),
        })

    return {
        "district": district,
        "source": "weatherapi",
        "specialty": "bulk + alerts + air quality",
        "forecast_days": daily_summary,
        "weather_alerts": [
            {
                "headline": a.get("headline"),
                "severity": a.get("severity"),
                "event": a.get("event"),
                "effective": a.get("effective"),
                "expires": a.get("expires"),
            }
            for a in alerts
        ],
        "tanker_safe_days": [
            d["date"] for d in daily_summary
            if d["rain_chance_pct"] < 30 and d["rainfall_mm"] < 5
        ],
    }


async def get_historical_district(district: str, date: str) -> Dict:
    """
    Fetch historical data for a specific past date.
    date format: YYYY-MM-DD
    """
    if API_KEY == "YOUR_FREE_KEY_HERE":
        return {"error": "WeatherAPI key not set"}

    query = f"{district},Maharashtra"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BASE_URL}/history.json",
            params={"key": API_KEY, "q": query, "dt": date}
        )
        resp.raise_for_status()
        data = resp.json()

    day = data.get("forecast", {}).get("forecastday", [{}])[0].get("day", {})
    return {
        "district": district,
        "date": date,
        "source": "weatherapi",
        "rainfall_mm": day.get("totalprecip_mm", 0),
        "max_temp_c": day.get("maxtemp_c"),
        "avg_humidity_pct": day.get("avghumidity"),
        "conditions": day.get("condition", {}).get("text", ""),
    }
