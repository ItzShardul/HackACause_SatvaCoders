from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from pydantic import BaseModel
from app.services.mapping_service import mapping_service
from app.services.whatsapp_service import whatsapp_service

router = APIRouter(prefix="/api/routes", tags=["Routes"])

class DispatchRequest(BaseModel):
    driver_name: str
    driver_phone: str
    village_name: str
    depot: Dict
    stops: List[Dict]
    quantity: int

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

@router.post("/dispatch")
async def dispatch_tanker(request: DispatchRequest):
    """
    Generate a Google Maps link and send it to the driver via WhatsApp.
    """
    try:
        # 1. Generate Navigation Link
        maps_link = whatsapp_service.generate_google_maps_link(request.depot, request.stops)
        
        # 2. Add some fallback logic for driver phone
        phone = request.driver_phone
        if not phone.startswith("+"):
            phone = "+91" + phone # Default to India for Vidarbha
            
        # 3. Send Message
        success = whatsapp_service.send_tanker_dispatch(
            driver_name=request.driver_name,
            driver_phone=phone,
            village_name=request.village_name,
            route_link=maps_link,
            quantity=request.quantity
        )
        
        if success:
            return {"status": "success", "message": "WhatsApp dispatch sent to driver."}
        else:
            return {"status": "error", "message": "Failed to send WhatsApp message. Check Twilio logs."}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
