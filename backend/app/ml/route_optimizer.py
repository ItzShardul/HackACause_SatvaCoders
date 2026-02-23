"""
Route optimization for tanker dispatch using OR-Tools VRP solver.
Optimizes multiple tanker routes simultaneously for minimum distance.
"""
import math
from typing import List, Dict, Tuple
from ortools.constraint_solver import routing_enums_pb2, pywrapcp


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two GPS coordinates in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def optimize_routes(
    depot: Dict,
    villages: List[Dict],
    num_vehicles: int = 3,
    max_distance_km: float = 200
) -> Dict:
    """
    Solve Vehicle Routing Problem (VRP) for tanker dispatch.
    
    Args:
        depot: {"lat": float, "lng": float, "name": str}
        villages: [{"id": int, "name": str, "lat": float, "lng": float, "demand": int, "priority": float}]
        num_vehicles: Number of available tankers
        max_distance_km: Max distance per vehicle
    
    Returns:
        Dict with optimized routes per vehicle
    """
    if not villages:
        return {"routes": [], "total_distance": 0, "status": "no_villages"}

    # Build locations list: depot (index 0) + villages
    locations = [{"lat": depot["lat"], "lng": depot["lng"], "name": depot.get("name", "Depot")}]
    for v in villages:
        locations.append({"lat": v["lat"], "lng": v["lng"], "name": v["name"]})

    n = len(locations)

    # Build distance matrix
    distance_matrix = []
    for i in range(n):
        row = []
        for j in range(n):
            if i == j:
                row.append(0)
            else:
                d = haversine_distance(
                    locations[i]["lat"], locations[i]["lng"],
                    locations[j]["lat"], locations[j]["lng"]
                )
                row.append(int(d * 1000))  # convert to meters for OR-Tools
        distance_matrix.append(row)

    # Create routing model
    manager = pywrapcp.RoutingIndexManager(n, num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Add distance constraint
    dimension_name = "Distance"
    routing.AddDimension(
        transit_callback_index,
        0,
        int(max_distance_km * 1000),
        True,
        dimension_name,
    )
    distance_dimension = routing.GetDimensionOrDie(dimension_name)
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    # Search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.FromSeconds(5)

    # Solve
    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        # Fallback: simple greedy assignment
        return _greedy_assignment(depot, villages, num_vehicles)

    # Extract routes
    routes = []
    total_distance = 0

    for vehicle_id in range(num_vehicles):
        route = []
        route_distance = 0
        index = routing.Start(vehicle_id)

        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node > 0:  # skip depot
                village = villages[node - 1]
                route.append({
                    "village_id": village["id"],
                    "village_name": village["name"],
                    "lat": village["lat"],
                    "lng": village["lng"],
                    "demand": village.get("demand", 0),
                    "priority": village.get("priority", 0),
                    "sequence": len(route) + 1,
                })
            prev_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(prev_index, index, vehicle_id)

        if route:
            distance_km = round(route_distance / 1000, 1)
            routes.append({
                "vehicle_id": vehicle_id,
                "stops": route,
                "total_distance_km": distance_km,
                "estimated_duration_min": round(distance_km * 2, 0),  # ~30 km/h avg
                "num_stops": len(route),
            })
            total_distance += distance_km

    return {
        "routes": routes,
        "total_distance_km": round(total_distance, 1),
        "num_vehicles_used": len([r for r in routes if r["stops"]]),
        "num_villages_served": sum(len(r["stops"]) for r in routes),
        "status": "optimized",
    }


def _greedy_assignment(depot: Dict, villages: List[Dict], num_vehicles: int) -> Dict:
    """Fallback greedy assignment if OR-Tools fails."""
    sorted_villages = sorted(villages, key=lambda v: v.get("priority", 0), reverse=True)
    routes = [{"vehicle_id": i, "stops": [], "total_distance_km": 0, "num_stops": 0} for i in range(num_vehicles)]

    for i, village in enumerate(sorted_villages):
        vehicle_idx = i % num_vehicles
        dist = haversine_distance(depot["lat"], depot["lng"], village["lat"], village["lng"])
        routes[vehicle_idx]["stops"].append({
            "village_id": village["id"],
            "village_name": village["name"],
            "lat": village["lat"],
            "lng": village["lng"],
            "demand": village.get("demand", 0),
            "priority": village.get("priority", 0),
            "sequence": len(routes[vehicle_idx]["stops"]) + 1,
        })
        routes[vehicle_idx]["total_distance_km"] += round(dist, 1)
        routes[vehicle_idx]["num_stops"] += 1

    for r in routes:
        r["estimated_duration_min"] = round(r["total_distance_km"] * 2, 0)

    total = sum(r["total_distance_km"] for r in routes)
    return {
        "routes": [r for r in routes if r["stops"]],
        "total_distance_km": round(total, 1),
        "num_vehicles_used": len([r for r in routes if r["stops"]]),
        "num_villages_served": sum(r["num_stops"] for r in routes),
        "status": "greedy_fallback",
    }
