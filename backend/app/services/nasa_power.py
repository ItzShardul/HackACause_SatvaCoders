"""
NASA POWER Service — 40 Years of Scientific Climate Data
FREE · No API key required
Specialty: Long-term historical baselines, evapotranspiration, solar radiation
Used for: Making ML drought predictions scientifically accurate
"""
import httpx
from typing import Dict
from datetime import datetime, timedelta

BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"

NAGPUR_COORDS = {
    "Nagpur Urban": (21.1458, 79.0882),
    "Nagpur Rural": (21.1000, 79.0500),
    "Kamptee":      (21.2227, 79.2014),
    "Hingna":       (21.0667, 78.9667),
    "Katol":        (21.2682, 78.5833),
    "Narkhed":      (21.4667, 78.5333),
    "Savner":       (21.3917, 78.9167),
    "Kalmeshwar":   (21.2333, 78.9167),
    "Ramtek":       (21.3938, 79.3275),
    "Parseoni":     (21.3833, 79.1667),
    "Mauda":        (21.1667, 79.4333),
    "Umred":        (20.8500, 79.3333),
    "Kuhi":         (21.0167, 79.3667),
    "Bhiwapur":     (20.7667, 79.5167),
}


async def get_historical_climate(district: str, start_year: int = 1990, end_year: int = 2023) -> Dict:
    """
    Fetch 40-year monthly climate data from NASA POWER.
    Returns long-term averages for accurate WSI baseline calculation.
    """
    coords = NAGPUR_COORDS.get(district)
    if not coords:
        return {"error": f"Area {district} not in Nagpur Pilot"}

    lat, lon = coords
    params = {
        "parameters": "PRECTOTCORR,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,EVPTRNS",
        # PRECTOTCORR = Precipitation (mm/day)
        # T2M_MAX/MIN  = Temperature
        # ALLSKY_SFC_SW_DWN = Solar radiation (for crop water demand)
        # EVPTRNS = Evapotranspiration
        "community": "AG",           # Agricultural community dataset
        "longitude": lon,
        "latitude": lat,
        "start": f"{start_year}01",
        "end": f"{end_year}12",
        "format": "JSON",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    props = data.get("properties", {}).get("parameter", {})
    rainfall_data = props.get("PRECTOTCORR", {})
    evap_data = props.get("EVPTRNS", {})

    # Calculate monthly 30-year normal (average per month across all years)
    monthly_normals = {}
    monthly_evap = {}
    for month in range(1, 13):
        month_str = f"{month:02d}"
        month_values = [
            v * 30  # convert mm/day to mm/month approx
            for k, v in rainfall_data.items()
            if k[4:6] == month_str and v != -999
        ]
        evap_values = [
            v * 30
            for k, v in evap_data.items()
            if k[4:6] == month_str and v != -999
        ]
        monthly_normals[month] = round(sum(month_values) / len(month_values), 1) if month_values else 0
        monthly_evap[month] = round(sum(evap_values) / len(evap_values), 1) if evap_values else 0

    # Annual normal
    annual_normal_mm = sum(monthly_normals.values())

    # Drought years identification (years with < 80% of normal)
    annual_by_year = {}
    for k, v in rainfall_data.items():
        year = k[:4]
        if year not in annual_by_year:
            annual_by_year[year] = 0
        if v != -999:
            annual_by_year[year] += v * 30

    drought_years = [
        yr for yr, total in annual_by_year.items()
        if total < annual_normal_mm * 0.8
    ]

    return {
        "district": district,
        "source": "nasa-power",
        "specialty": "40-year scientific baseline",
        "data_years": f"{start_year}–{end_year}",
        "annual_normal_mm": round(annual_normal_mm, 1),
        "monthly_normals_mm": monthly_normals,
        "monthly_evapotranspiration_mm": monthly_evap,
        "drought_years_identified": sorted(drought_years)[-10:],  # last 10
        "drought_frequency_pct": round(len(drought_years) / (end_year - start_year) * 100, 1),
    }


async def get_baseline_for_wsi(district: str) -> Dict:
    """
    Quick fetch: get just the annual normal rainfall for WSI calculation.
    Used by the ML engine to determine 'how far below normal' a district is.
    """
    try:
        data = await get_historical_climate(district, start_year=2000, end_year=2023)
        return {
            "district": district,
            "annual_normal_mm": data.get("annual_normal_mm", 900),
            "monthly_normals": data.get("monthly_normals_mm", {}),
            "drought_frequency_pct": data.get("drought_frequency_pct", 30),
        }
    except Exception:
        # Fallback: known Nagpur region averages if API fails
        defaults = {
            "Nagpur Urban": 1100, "Nagpur Rural": 1080, "Kamptee": 1120,
            "Hingna": 1050, "Katol": 980, "Narkhed": 950,
            "Savner": 1020, "Kalmeshwar": 1040, "Ramtek": 1150,
            "Parseoni": 1100, "Mauda": 1200, "Umred": 1180,
            "Kuhi": 1250, "Bhiwapur": 1300
        }
        return {
            "district": district,
            "annual_normal_mm": defaults.get(district, 1100),
            "monthly_normals": {},
            "drought_frequency_pct": 25,
        }
