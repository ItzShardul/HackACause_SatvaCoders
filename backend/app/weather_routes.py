"""
Weather API Routes — exposes all 4 weather services as REST endpoints.
"""
from fastapi import APIRouter
from app.services.weather_aggregator import (
    get_live_rainfall_all_districts,
    get_district_full_profile,
    get_wsi_inputs_for_all_districts,
)
from app.services.nasa_power import get_historical_climate
from app.services.visual_crossing import get_drought_analysis
from app.services.weather_api_service import get_forecast_district

weather_router = APIRouter(prefix="/api/weather", tags=["weather"])


@weather_router.get("/live")
async def live_rainfall():
    """
    Open-Meteo + WeatherAPI: Live rainfall for all 11 Vidarbha districts.
    Refreshes every 30 minutes. No API key needed for Open-Meteo.
    """
    return await get_live_rainfall_all_districts()


@weather_router.get("/district/{district}")
async def district_profile(district: str):
    """
    Full weather profile combining ALL 4 APIs:
    - Open-Meteo: live + 14-day forecast
    - NASA POWER: 40-year baseline
    - Visual Crossing: drought spell history (if key set)
    - WeatherAPI: alerts + tanker-safe days (if key set)
    """
    return await get_district_full_profile(district)


@weather_router.get("/nasa/{district}")
async def nasa_historical(district: str, start_year: int = 2000, end_year: int = 2023):
    """
    NASA POWER: 40-year monthly climate data.
    Returns: annual normals, drought frequency, evapotranspiration baselines.
    """
    return await get_historical_climate(district, start_year, end_year)


@weather_router.get("/drought-analysis/{district}")
async def drought_analysis(district: str, year: int = 2023):
    """
    Visual Crossing: Month-by-month drought classification for a year.
    Requires VISUAL_CROSSING_API_KEY in .env
    """
    return await get_drought_analysis(district, year)


@weather_router.get("/forecast/{district}")
async def district_forecast(district: str, days: int = 7):
    """
    WeatherAPI: 7-day detailed forecast with weather alerts.
    Also returns: tanker-safe days (low rain probability).
    Requires WEATHER_API_KEY in .env
    """
    return await get_forecast_district(district, days)


@weather_router.get("/wsi-inputs")
async def wsi_inputs():
    """
    Unified WSI inputs for all districts.
    Used by ML engine to recalculate Water Stress Index from live data.
    """
    return await get_wsi_inputs_for_all_districts()
