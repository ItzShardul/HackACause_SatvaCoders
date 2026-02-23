"""
Route optimization for tanker dispatch.
Uses Haversine distance for fast, reliable optimization.
Road geometry is fetched separately by the routing service for map display.
"""
import math
from typing import List, Dict


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate straight-line distance between two GPS points in km."""
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return round(R * c, 2)


def _greedy_vrp_optimizer(
    villages: List[Dict],
    depot: Dict,
    num_vehicles: int
) -> Dict:
    """
    Robust Greedy VRP optimizer using Haversine distances.
    Guaranteed to work without external API or C-extension issues.
    """
    # Sort villages by priority
    sorted_villages = sorted(villages, key=lambda v: v.get("priority", 0), reverse=True)
    
    routes = [{"vehicle_id": i, "stops": [], "total_distance_km": 0.0} for i in range(num_vehicles)]
    
    # Assign villages to tankers in a priority-aware balanced way
    for i, village in enumerate(sorted_villages):
        v_idx = i % num_vehicles
        
        # Calculate distance from last stop (or depot)
        prev_lat = depot["lat"]
        prev_lng = depot["lng"]
        if routes[v_idx]["stops"]:
            prev_lat = routes[v_idx]["stops"][-1]["lat"]
            prev_lng = routes[v_idx]["stops"][-1]["lng"]
            
        dist = haversine_distance(prev_lat, prev_lng, village["lat"], village["lng"])
        
        routes[v_idx]["stops"].append({
            "village_id": village["id"],
            "village_name": village["name"],
            "lat": village["lat"],
            "lng": village["lng"],
            "demand": village.get("demand", 0),
            "priority": village.get("priority", 0),
            "sequence": len(routes[v_idx]["stops"]) + 1,
        })
        routes[v_idx]["total_distance_km"] += dist

    # Add return to depot distance and finalize
    final_routes = []
    total_km = 0
    total_served = 0
    
    for r in routes:
        if not r["stops"]:
            continue
            
        # Return to depot
        last_v = r["stops"][-1]
        back_dist = haversine_distance(last_v["lat"], last_v["lng"], depot["lat"], depot["lng"])
        r["total_distance_km"] = round(r["total_distance_km"] + back_dist, 1)
        r["num_stops"] = len(r["stops"])
        r["estimated_duration_min"] = round(r["total_distance_km"] * 2.5, 0) # ~24 km/h avg rural speed
        
        total_km += r["total_distance_km"]
        total_served += r["num_stops"]
        final_routes.append(r)

    return {
        "routes": final_routes,
        "total_distance_km": round(total_km, 1),
        "num_vehicles_used": len(final_routes),
        "num_villages_served": total_served,
        "status": "optimized",
        "provider": "haversine_internal"
    }


async def optimize_routes(
    depot: Dict,
    villages: List[Dict],
    num_vehicles: int = 3,
    max_distance_km: float = 300
) -> Dict:
    """
    Entry point for route optimization.
    Uses robust internal logic for Nagpur Pilot.
    """
    if not villages:
        return {"routes": [], "total_distance_km": 0, "status": "no_villages", "provider": "none"}

    return _greedy_vrp_optimizer(villages, depot, num_vehicles)
