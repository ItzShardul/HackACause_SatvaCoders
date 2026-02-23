import httpx
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class MappingService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTE_SERVICE_KEY")
        self.base_url = "https://api.openrouteservice.org/v2/directions/driving-car"

    async def get_road_route(self, start_coords: List[float], end_coords: List[float]) -> Dict:
        """
        Get actual road coordinates between two points.
        Coords format: [latitude, longitude]
        ORS format: [longitude, latitude]
        """
        if not self.api_key or "YOUR_FREE" in self.api_key:
            # Fallback to straight line if no key
            return {
                "type": "LineString",
                "coordinates": [
                    [start_coords[1], start_coords[0]],
                    [end_coords[1], end_coords[0]]
                ],
                "distance_km": self._calculate_haversine(start_coords, end_coords),
                "duration_mins": self._calculate_haversine(start_coords, end_coords) * 1.5,
                "is_fallback": True
            }

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
                        "coordinates": geometry["coordinates"], # [lon, lat] pairs
                        "distance_km": round(summary["distance"] / 1000, 2),
                        "duration_mins": round(summary["duration"] / 60, 1),
                        "is_fallback": False
                    }
                else:
                    raise Exception(f"ORS API Error: {response.status_code}")
                    
            except Exception as e:
                print(f"Mapping Service Error: {e}")
                return {
                    "type": "LineString",
                    "coordinates": [
                        [start_coords[1], start_coords[0]],
                        [end_coords[1], end_coords[0]]
                    ],
                    "distance_km": self._calculate_haversine(start_coords, end_coords),
                    "duration_mins": self._calculate_haversine(start_coords, end_coords) * 1.5,
                    "is_fallback": True
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
