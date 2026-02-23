"""
Weather Aggregator — Combines all 4 APIs, each contributing its specialty.

Flow:
  Open-Meteo  → Live rainfall + 14-day forecast  (no key, runs always)
  NASA POWER  → 40-year scientific baseline       (no key, runs weekly)
  Visual Cross → Historical daily precision        (free key needed)
  WeatherAPI   → Bulk all-district + air quality   (free key needed)

Smart fallback: if paid APIs have no key, free APIs cover all critical data.
"""
import asyncio
from typing import Dict, Optional
from datetime import datetime

from app.services.open_meteo import get_all_districts_weather, get_district_weather
from app.services.nasa_power import get_baseline_for_wsi, get_historical_climate
from app.services.visual_crossing import get_historical_daily, get_drought_analysis
from app.services.weather_api_service import get_current_all_districts, get_forecast_district

# In-memory cache — avoids hitting APIs on every request
_cache: Dict = {}
_cache_time: Dict = {}
CACHE_TTL_SECONDS = 3600  # 1 hour


def _is_cached(key: str, ttl: int = CACHE_TTL_SECONDS) -> bool:
    if key not in _cache_time:
        return False
    elapsed = (datetime.now() - _cache_time[key]).total_seconds()
    return elapsed < ttl


def _set_cache(key: str, value):
    _cache[key] = value
    _cache_time[key] = datetime.now()


async def get_live_rainfall_all_districts() -> Dict:
    """
    PRIMARY: Open-Meteo (free, no key) — live rainfall for all 11 districts.
    SUPPLEMENT: WeatherAPI.com — adds air quality + weather alerts if key set.
    Returns merged result.
    """
    cache_key = "live_rainfall"
    if _is_cached(cache_key, ttl=1800):  # 30 min cache
        return _cache[cache_key]

    # Always runs — Open-Meteo (free)
    open_meteo_data = await get_all_districts_weather()

    # Runs if API key configured — WeatherAPI (bulk + air quality)
    weather_api_data = {}
    try:
        weather_api_data = await get_current_all_districts()
        if "error" in weather_api_data:
            weather_api_data = {}
    except Exception:
        pass

    # Merge: Open-Meteo is primary, WeatherAPI supplements
    merged = {}
    for district, om_data in open_meteo_data.items():
        wa_data = weather_api_data.get(district, {})
        merged[district] = {
            **om_data,
            # Add WeatherAPI extras if available
            "air_quality_pm25": wa_data.get("air_quality_pm25"),
            "dust_storm_risk": wa_data.get("dust_storm_risk", "unknown"),
            "weather_condition": wa_data.get("condition", ""),
            "humidity_pct": wa_data.get("humidity_pct"),
            "data_sources": ["open-meteo"] + (["weather-api"] if wa_data else []),
        }

    result = {
        "fetched_at": datetime.now().isoformat(),
        "districts": merged,
        "total_districts": len(merged),
        "apis_used": ["open-meteo (live+forecast)"] + (["weatherapi (bulk+AQI)"] if weather_api_data else []),
    }
    _set_cache(cache_key, result)
    return result


async def get_district_full_profile(district: str) -> Dict:
    """
    Full weather profile for one district using all 4 APIs.
    Open-Meteo: Live + forecast
    NASA POWER: 40-yr baseline + evapotranspiration
    Visual Crossing: Historical drought spells (if key set)
    WeatherAPI: Detailed 7-day forecast + alerts (if key set)
    """
    cache_key = f"profile_{district}"
    if _is_cached(cache_key, ttl=3600):
        return _cache[cache_key]

    # Run all async in parallel
    tasks = [
        get_district_weather(district),           # Open-Meteo
        get_baseline_for_wsi(district),            # NASA POWER
    ]

    try:
        vc_task = get_drought_analysis(district, year=2023)
        tasks.append(vc_task)
    except Exception:
        tasks.append(asyncio.coroutine(lambda: {})())

    results = await asyncio.gather(*tasks, return_exceptions=True)

    open_meteo = results[0] if not isinstance(results[0], Exception) else {}
    nasa = results[1] if not isinstance(results[1], Exception) else {}
    visual_crossing = results[2] if len(results) > 2 and not isinstance(results[2], Exception) else {}

    # WeatherAPI forecast (separately — lower priority)
    wa_forecast = {}
    try:
        wa_forecast = await get_forecast_district(district, days=7)
        if "error" in wa_forecast:
            wa_forecast = {}
    except Exception:
        pass

    profile = {
        "district": district,
        "fetched_at": datetime.now().isoformat(),

        # API 1 — Open-Meteo
        "live": {
            "source": "Open-Meteo (real-time + 14-day forecast)",
            "rainfall_last_30d_mm": open_meteo.get("current_rainfall_30d_mm", 0),
            "forecast_14d_mm": open_meteo.get("forecast_14d_mm", 0),
            "drought_risk": open_meteo.get("drought_risk", "unknown"),
            "forecast_series": open_meteo.get("forecast_14_days", []),
        },

        # API 2 — NASA POWER
        "historical_baseline": {
            "source": "NASA POWER (40-year scientific data)",
            "annual_normal_mm": nasa.get("annual_normal_mm", 900),
            "monthly_normals_mm": nasa.get("monthly_normals", {}),
            "drought_frequency_pct": nasa.get("drought_frequency_pct", 30),
        },

        # API 3 — Visual Crossing (if key set)
        "drought_history": {
            "source": "Visual Crossing (historical daily precision)",
            "available": "error" not in visual_crossing,
            "drought_month_analysis": visual_crossing.get("drought_month_analysis", {}),
            "longest_dry_spell_days": visual_crossing.get("longest_dry_spell_days", 0),
            "annual_total_2023_mm": visual_crossing.get("annual_total_mm", 0),
        },

        # API 4 — WeatherAPI (if key set)
        "alerts_and_forecast": {
            "source": "WeatherAPI (bulk + air quality + alerts)",
            "available": bool(wa_forecast),
            "weather_alerts": wa_forecast.get("weather_alerts", []),
            "tanker_safe_days": wa_forecast.get("tanker_safe_days", []),
            "7_day_forecast": wa_forecast.get("forecast_days", []),
        },

        # Computed: rainfall deficit using NASA baseline vs Open-Meteo actual
        "computed": {
            "rainfall_deficit_pct": round(
                (1 - open_meteo.get("current_rainfall_30d_mm", 0) /
                 max(nasa.get("annual_normal_mm", 900) / 12, 1)) * 100, 1
            ),
            "wsi_input_ready": True,
        },
    }

    _set_cache(cache_key, profile)
    return profile


async def get_wsi_inputs_for_all_districts() -> Dict[str, Dict]:
    """
    Used by the ML engine to recalculate WSI with live data.
    Returns: actual rainfall, normal baseline, evapotranspiration per district.
    """
    live = await get_live_rainfall_all_districts()
    districts_data = live.get("districts", {})

    wsi_inputs = {}
    for district, data in districts_data.items():
        # Get NASA baseline (cached after first call)
        nasa = await get_baseline_for_wsi(district)

        actual_30d = data.get("rainfall_last_7d_mm", 0) * (30 / 7)  # scale 7d to 30d
        normal_30d = nasa.get("annual_normal_mm", 900) / 12  # monthly normal

        wsi_inputs[district] = {
            "actual_rainfall_mm": actual_30d,
            "normal_rainfall_mm": normal_30d,
            "rainfall_deficit_pct": round((1 - actual_30d / max(normal_30d, 1)) * 100, 1),
            "forecast_14d_mm": data.get("forecast_14d_mm", 0),
            "drought_risk": data.get("drought_risk", "unknown"),
        }

    return wsi_inputs
