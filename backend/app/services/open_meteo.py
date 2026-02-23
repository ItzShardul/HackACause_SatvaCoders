"""
Open-Meteo Service — Real-time rainfall + 14-day forecast
FREE · No API key required
Specialty: Live current conditions, hourly updates, short-term forecast
"""
import httpx
from typing import Dict, List

# All 14 Nagpur Talukas with GPS coordinates
NAGPUR_TALUKAS = {
    "Nagpur Urban": {"lat": 21.1458, "lon": 79.0882},
    "Nagpur Rural": {"lat": 21.1000, "lon": 79.0500},
    "Kamptee":      {"lat": 21.2227, "lon": 79.2014},
    "Hingna":       {"lat": 21.0667, "lon": 78.9667},
    "Katol":        {"lat": 21.2682, "lon": 78.5833},
    "Narkhed":      {"lat": 21.4667, "lon": 78.5333},
    "Savner":       {"lat": 21.3917, "lon": 78.9167},
    "Kalmeshwar":   {"lat": 21.2333, "lon": 78.9167},
    "Ramtek":       {"lat": 21.3938, "lon": 79.3275},
    "Parseoni":     {"lat": 21.3833, "lon": 79.1667},
    "Mauda":        {"lat": 21.1667, "lon": 79.4333},
    "Umred":        {"lat": 20.8500, "lon": 79.3333},
    "Kuhi":         {"lat": 21.0167, "lon": 79.3667},
    "Bhiwapur":     {"lat": 20.7667, "lon": 79.5167},
}

BASE_URL = "https://api.open-meteo.com/v1/forecast"


async def get_district_weather(district: str) -> Dict:
    """Get current + 14-day forecast for a single area."""
    coords = NAGPUR_TALUKAS.get(district)
    if not coords:
        return {}

    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "daily": [
            "precipitation_sum",        # rainfall mm per day
            "temperature_2m_max",       # max temp
            "temperature_2m_min",       # min temp
            "et0_fao_evapotranspiration", # water evaporation from soil
            "rain_sum",                 # pure rain (excluding snow)
        ],
        "hourly": "precipitation",       # hourly rainfall for today
        "past_days": 30,                 # last 30 days actual data
        "forecast_days": 14,             # 14-day forecast
        "timezone": "Asia/Kolkata",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    daily = data.get("daily", {})
    dates = daily.get("time", [])
    rainfall = daily.get("precipitation_sum", [])
    temp_max = daily.get("temperature_2m_max", [])
    evapotranspiration = daily.get("et0_fao_evapotranspiration", [])

    # Split into past (actual) and future (forecast)
    today_idx = 30  # past_days = 30
    past = [
        {"date": dates[i], "rainfall_mm": rainfall[i] or 0, "temp_max": temp_max[i]}
        for i in range(min(today_idx, len(dates)))
    ]
    forecast = [
        {
            "date": dates[i],
            "rainfall_mm": rainfall[i] or 0,
            "temp_max": temp_max[i],
            "evapotranspiration_mm": evapotranspiration[i] or 0,
        }
        for i in range(today_idx, len(dates))
    ]

    total_actual_30d = sum(r["rainfall_mm"] for r in past)
    total_forecast_14d = sum(r["rainfall_mm"] for r in forecast)

    return {
        "district": district,
        "source": "open-meteo",
        "specialty": "real-time + 14-day forecast",
        "current_rainfall_30d_mm": round(total_actual_30d, 1),
        "forecast_14d_mm": round(total_forecast_14d, 1),
        "drought_risk": "high" if total_forecast_14d < 20 else "medium" if total_forecast_14d < 50 else "low",
        "past_30_days": past,
        "forecast_14_days": forecast,
    }


async def get_all_districts_weather() -> Dict[str, Dict]:
    """Fetch live weather for all Nagpur talukas."""
    results = {}
    async with httpx.AsyncClient(timeout=20) as client:
        for district, coords in NAGPUR_TALUKAS.items():
            try:
                params = {
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "daily": ["precipitation_sum", "et0_fao_evapotranspiration"],
                    "past_days": 7,
                    "forecast_days": 14,
                    "timezone": "Asia/Kolkata",
                }
                resp = await client.get(BASE_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                daily = data.get("daily", {})
                rainfall = daily.get("precipitation_sum", [])
                dates = daily.get("time", [])
                total_7d = sum((r or 0) for r in rainfall[:7])
                forecast_14d = sum((r or 0) for r in rainfall[7:])
                results[district] = {
                    "district": district,
                    "rainfall_last_7d_mm": round(total_7d, 1),
                    "forecast_14d_mm": round(forecast_14d, 1),
                    "drought_risk": "high" if forecast_14d < 20 else "medium" if forecast_14d < 50 else "low",
                    "lat": coords["lat"], "lon": coords["lon"],
                    "dates": dates,
                    "rainfall_series": [r or 0 for r in rainfall],
                }
            except Exception as e:
                results[district] = {"district": district, "error": str(e)}

    return results
