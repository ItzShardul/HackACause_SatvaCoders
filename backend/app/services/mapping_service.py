import httpx
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

from app.services.mappls_service import mappls_service

class MappingService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTE_SERVICE_KEY")
        self.base_url = "https://api.openrouteservice.org/v2/directions/driving-car"

    async def get_road_route(self, start_coords: List[float], end_coords: List[float]) -> Dict:
        """
        Get actual road coordinates between two points.
        Coords format: [latitude, longitude]
        Sequence: Mappls -> ORS -> Fallback
        """
        # 1. Try Mappls first (Higher priority for Nagpur Pilot)
        try:
            mappls_route = await mappls_service.get_directions(start_coords, end_coords)
            if mappls_route:
                return {
                    "type": "LineString",
                    "coordinates": mappls_route["coordinates"],
                    "distance_km": mappls_route["distance_km"],
                    "duration_mins": mappls_route["duration_mins"],
                    "is_fallback": False,
                    "provider": "mappls"
                }
        except Exception:
            pass

        # 2. Try OpenRouteService
        if self.api_key and "YOUR_FREE" not in self.api_key:
            async with httpx.AsyncClient() as client:
                try:
                    # ORS expects [lon, lat]
                    params = {
                        "api_key": self.api_key,
                        "start": f"{start_coords[1]},{start_coords[0]}",
                        "end": f"{end_coords[1]},{end_coords[0]}"
                    }
                    
                    response = await client.get(self.base_url, params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        geometry = data["features"][0]["geometry"]
                        summary = data["features"][0]["properties"]["summary"]
                        
                        return {
                            "type": "LineString",
                            "coordinates": geometry["coordinates"],
                            "distance_km": round(summary["distance"] / 1000, 2),
                            "duration_mins": round(summary["duration"] / 60, 1),
                            "is_fallback": False,
                            "provider": "ors"
                        }
                except Exception:
                    pass

        # 3. Final Fallback (Straight Line)
        return {
            "type": "LineString",
            "coordinates": [
                [start_coords[1], start_coords[0]],
                [end_coords[1], end_coords[0]]
            ],
            "distance_km": self._calculate_haversine(start_coords, end_coords),
            "duration_mins": self._calculate_haversine(start_coords, end_coords) * 1.5,
            "is_fallback": True,
            "provider": "haversine"
        }

    def _calculate_haversine(self, c1, c2):
        import math
        # Basic crow-flies distance estimate
        lat1, lon1 = c1
        lat2, lon2 = c2
        R = 6371 # km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return round(R * c, 2)

mapping_service = MappingService()
