import httpx
from typing import List, Dict, Optional
from app.config import MAPPLS_REST_KEY


class MapplsService:
    """
    Service for Mappls (MapmyIndia) APIs.
    Provides Real Road Distance Matrix and Directions for Nagpur Pilot.
    Uses REST Key directly — no OAuth needed for these endpoints.
    """

    def __init__(self):
        self.rest_key = MAPPLS_REST_KEY
        self.base = "https://apis.mappls.com/advancedmaps/v1"

    def _is_configured(self) -> bool:
        return bool(self.rest_key)

    async def get_distance_km(self, start: List[float], end: List[float]) -> Optional[Dict]:
        """
        Get real road distance and duration between two points.
        start & end: [lat, lon]
        Returns {distance_km, duration_mins} or None on failure.
        """
        if not self._is_configured():
            return None

        # Mappls expects lon,lat format
        coords_str = f"{start[1]},{start[0]};{end[1]},{end[0]}"
        url = f"{self.base}/{self.rest_key}/distance_matrix/driving/{coords_str}"

        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("responseCode") == 200:
                        results = data["results"]
                        # Matrix is 1x2: row=source, [0]=self, [1]=destination
                        dist_m = results["distances"][0][1]
                        dur_s = results["durations"][0][1]
                        return {
                            "distance_km": round(dist_m / 1000, 2),
                            "duration_mins": round(dur_s / 60, 1)
                        }
            except Exception as e:
                print(f"Mappls Distance Error: {e}")
        return None

    async def get_directions(self, start: List[float], end: List[float]) -> Optional[Dict]:
        """
        Get driving directions (route geometry) between two points.
        start & end: [lat, lon]
        Returns {coordinates [[lon,lat],...], distance_km, duration_mins} or None.
        """
        if not self._is_configured():
            return None

        # Mappls route_adv: lon,lat format
        url = f"{self.base}/{self.rest_key}/route_adv/driving/{start[1]},{start[0]};{end[1]},{end[0]}"
        params = {"geometries": "geojson", "overview": "simplified"}

        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("routes"):
                        route = data["routes"][0]
                        coords = route.get("geometry", {}).get("coordinates", [])
                        if not coords:
                            coords = [[start[1], start[0]], [end[1], end[0]]]
                        return {
                            "coordinates": coords,
                            "distance_km": round(route.get("distance", 0) / 1000, 2),
                            "duration_mins": round(route.get("duration", 0) / 60, 1),
                        }
            except Exception as e:
                print(f"Mappls Directions Error: {e}")

        # Fallback: use distance matrix for at least the real distance
        dist_data = await self.get_distance_km(start, end)
        if dist_data:
            return {
                "coordinates": [[start[1], start[0]], [end[1], end[0]]],
                "distance_km": dist_data["distance_km"],
                "duration_mins": dist_data["duration_mins"],
            }
        return None

    async def get_distance_matrix(
        self, sources: List[List[float]], destinations: List[List[float]]
    ) -> Optional[Dict]:
        """
        Get road distance matrix for multiple source/destination pairs.
        sources & destinations: [[lat, lon], ...]
        Returns raw Mappls response with results.distances and results.durations.
        """
        if not self._is_configured():
            return None

        # Combine all unique points in lon,lat format
        all_points = sources + destinations
        seen = set()
        unique = []
        for p in all_points:
            key = (p[0], p[1])
            if key not in seen:
                seen.add(key)
                unique.append(p)

        coords_str = ";".join([f"{p[1]},{p[0]}" for p in unique])
        url = f"{self.base}/{self.rest_key}/distance_matrix/driving/{coords_str}"

        async with httpx.AsyncClient(timeout=20) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("responseCode") == 200 and data.get("results"):
                        return data
            except Exception as e:
                print(f"Mappls Distance Matrix Error: {e}")
        return None


mappls_service = MapplsService()
