"""
Visual Crossing Service — Deep Historical Daily Data
FREE tier: 1,000 records/day | API key required (free signup)
Specialty: Precise historical daily rainfall records, drought event analysis
Sign up: https://www.visualcrossing.com/sign-up
"""
import httpx
from typing import Dict, List
from datetime import datetime, timedelta
import os

API_KEY = os.getenv("VISUAL_CROSSING_API_KEY", "YOUR_FREE_KEY_HERE")
BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"

VIDARBHA_COORDS = {
    "Yavatmal":   "20.3888,78.1204",
    "Akola":      "20.7096,77.0075",
    "Washim":     "20.1108,77.1330",
    "Buldhana":   "20.5293,76.1852",
    "Amravati":   "20.9320,77.7523",
    "Nagpur":     "21.1458,79.0882",
    "Wardha":     "20.7453,78.6022",
    "Chandrapur": "19.9615,79.2961",
    "Bhandara":   "21.1667,79.6500",
    "Gondia":     "21.4631,80.1953",
    "Gadchiroli": "20.1809,80.0005",
}


async def get_historical_daily(
    district: str,
    start_date: str = "2020-01-01",
    end_date: str = None
) -> Dict:
    """
    Fetch precise daily historical rainfall records.
    Specialty: Day-by-day accuracy, drought spell identification.
    """
    if API_KEY == "YOUR_FREE_KEY_HERE":
        return {
            "error": "Visual Crossing API key not set",
            "signup": "https://www.visualcrossing.com/sign-up",
            "env_var": "VISUAL_CROSSING_API_KEY",
        }

    coords = VIDARBHA_COORDS.get(district)
    if not coords:
        return {"error": f"District {district} not found"}

    end_date = end_date or datetime.now().strftime("%Y-%m-%d")
    url = f"{BASE_URL}/{coords}/{start_date}/{end_date}"

    params = {
        "unitGroup": "metric",
        "elements": "datetime,precip,precipprob,temp,humidity,conditions",
        "include": "days",
        "key": API_KEY,
        "contentType": "json",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    days = data.get("days", [])

    # Identify drought spells (consecutive days with < 1mm rain)
    drought_spells = []
    current_spell = 0
    for day in days:
        if (day.get("precip") or 0) < 1:
            current_spell += 1
        else:
            if current_spell >= 14:  # 14+ dry days = drought spell
                drought_spells.append(current_spell)
            current_spell = 0

    # Monthly aggregation
    monthly = {}
    for day in days:
        key = day["datetime"][:7]  # YYYY-MM
        if key not in monthly:
            monthly[key] = 0
        monthly[key] += day.get("precip") or 0

    total_rainfall = sum(d.get("precip") or 0 for d in days)
    max_dry_spell = max(drought_spells) if drought_spells else 0

    return {
        "district": district,
        "source": "visual-crossing",
        "specialty": "historical daily precision + drought spell detection",
        "period": f"{start_date} to {end_date}",
        "total_days": len(days),
        "total_rainfall_mm": round(total_rainfall, 1),
        "avg_daily_mm": round(total_rainfall / len(days), 2) if days else 0,
        "drought_spells_count": len(drought_spells),
        "longest_dry_spell_days": max_dry_spell,
        "monthly_totals_mm": {k: round(v, 1) for k, v in monthly.items()},
        "daily_records": [
            {
                "date": d["datetime"],
                "rainfall_mm": d.get("precip") or 0,
                "conditions": d.get("conditions", ""),
            }
            for d in days[-30:]  # last 30 days
        ],
    }


async def get_drought_analysis(district: str, year: int = 2023) -> Dict:
    """
    Full year drought analysis — identifies worst drought periods.
    Specialty: Granular drought event timeline for historical reporting.
    """
    start = f"{year}-01-01"
    end = f"{year}-12-31"
    data = await get_historical_daily(district, start, end)

    if "error" in data:
        return data

    monthly = data.get("monthly_totals_mm", {})

    # Classify each month
    classified = {}
    for month_key, rainfall in monthly.items():
        if rainfall < 20:
            level = "severe_drought"
        elif rainfall < 50:
            level = "moderate_drought"
        elif rainfall < 80:
            level = "mild_drought"
        else:
            level = "normal"
        classified[month_key] = {"rainfall_mm": rainfall, "classification": level}

    return {
        "district": district,
        "year": year,
        "source": "visual-crossing",
        "drought_month_analysis": classified,
        "longest_dry_spell_days": data.get("longest_dry_spell_days", 0),
        "annual_total_mm": data.get("total_rainfall_mm", 0),
    }
