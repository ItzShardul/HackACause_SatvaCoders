from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.services.mapping_service import mapping_service

router = APIRouter(prefix="/api/routes", tags=["Routes"])

@router.get("/calculate")
async def get_route(start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    """
    Get actual road route coordinates between two points.
    Returns GeoJSON-style LineString with distance and duration.
    """
    try:
        route_data = await mapping_service.get_road_route(
            [start_lat, start_lon], 
            [end_lat, end_lon]
        )
        return route_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
