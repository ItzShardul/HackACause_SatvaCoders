"""
API routes for JalMitra backend.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import (
    Village, WaterStressRecord, Tanker, Trip, WaterRequest,
    Prediction, RainfallData, GroundwaterData, Grievance, User
)
from app.ml.wsi_calculator import wsi_calculator
from app.ml.allocation_engine import allocation_engine
from app.ml.drought_predictor import drought_predictor
from app.ml.route_optimizer import optimize_routes

router = APIRouter(prefix="/api")


# ═══════════════════════════════════════════
# DASHBOARD OVERVIEW
# ═══════════════════════════════════════════
@router.get("/dashboard/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    """Get aggregated dashboard statistics."""
    total_villages = db.query(func.count(Village.id)).scalar()

    # WSI distribution
    wsi_records = db.query(WaterStressRecord).order_by(
        WaterStressRecord.village_id, WaterStressRecord.date.desc()
    ).all()

    # Get latest WSI per village
    latest_wsi = {}
    for r in wsi_records:
        if r.village_id not in latest_wsi:
            latest_wsi[r.village_id] = r

    severity_counts = {"normal": 0, "watch": 0, "warning": 0, "critical": 0, "emergency": 0}
    total_wsi = 0
    for r in latest_wsi.values():
        severity_counts[r.severity] = severity_counts.get(r.severity, 0) + 1
        total_wsi += r.wsi_score

    avg_wsi = round(total_wsi / len(latest_wsi), 1) if latest_wsi else 0

    # Tanker stats
    total_tankers = db.query(func.count(Tanker.id)).scalar()
    available_tankers = db.query(func.count(Tanker.id)).filter(Tanker.status == "available").scalar()
    on_trip_tankers = db.query(func.count(Tanker.id)).filter(Tanker.status == "on_trip").scalar()

    # Trip stats
    trips_today = db.query(func.count(Trip.id)).filter(
        Trip.scheduled_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).scalar()
    delivered_today = db.query(func.count(Trip.id)).filter(
        Trip.status == "delivered",
        Trip.completed_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).scalar()

    # Pending requests
    pending_requests = db.query(func.count(WaterRequest.id)).filter(
        WaterRequest.status.in_(["pending", "approved"])
    ).scalar()

    # Open grievances
    open_grievances = db.query(func.count(Grievance.id)).filter(
        Grievance.status.in_(["open", "in_progress"])
    ).scalar()

    # Total population affected (critical + emergency)
    affected_village_ids = [vid for vid, r in latest_wsi.items() if r.severity in ["critical", "emergency"]]
    affected_pop = db.query(func.sum(Village.population)).filter(
        Village.id.in_(affected_village_ids)
    ).scalar() or 0

    return {
        "total_villages": total_villages,
        "avg_wsi": avg_wsi,
        "severity_distribution": severity_counts,
        "critical_villages": severity_counts.get("critical", 0) + severity_counts.get("emergency", 0),
        "affected_population": affected_pop,
        "tankers": {
            "total": total_tankers,
            "available": available_tankers,
            "on_trip": on_trip_tankers,
            "maintenance": total_tankers - available_tankers - on_trip_tankers,
        },
        "trips_today": trips_today,
        "delivered_today": delivered_today,
        "pending_requests": pending_requests,
        "open_grievances": open_grievances,
    }


# ═══════════════════════════════════════════
# VILLAGES
# ═══════════════════════════════════════════
@router.get("/villages")
def get_villages(
    district: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all villages with latest WSI data."""
    query = db.query(Village)
    if district:
        query = query.filter(Village.district == district)

    villages = query.all()
    result = []

    for v in villages:
        wsi = db.query(WaterStressRecord).filter(
            WaterStressRecord.village_id == v.id
        ).order_by(WaterStressRecord.date.desc()).first()

        if severity and wsi and wsi.severity != severity:
            continue

        result.append({
            "id": v.id,
            "name": v.name,
            "district": v.district,
            "taluka": v.taluka,
            "latitude": v.latitude,
            "longitude": v.longitude,
            "population": v.population,
            "households": v.households,
            "primary_water_source": v.primary_water_source,
            "groundwater_level": v.groundwater_level,
            "wsi": {
                "score": wsi.wsi_score if wsi else None,
                "severity": wsi.severity if wsi else "unknown",
                "date": wsi.date.isoformat() if wsi else None,
                "components": wsi.components if wsi else None,
            } if wsi else None,
        })

    return result


@router.get("/villages/{village_id}")
def get_village_detail(village_id: int, db: Session = Depends(get_db)):
    """Get detailed village info with WSI, trends, and history."""
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    # WSI
    wsi_data = wsi_calculator.calculate_wsi(db, village)

    # Rainfall history
    rainfall = db.query(RainfallData).filter(
        RainfallData.village_id == village_id
    ).order_by(RainfallData.date.asc()).all()

    # Groundwater history
    groundwater = db.query(GroundwaterData).filter(
        GroundwaterData.village_id == village_id
    ).order_by(GroundwaterData.date.asc()).all()

    # Predictions
    predictions = db.query(Prediction).filter(
        Prediction.village_id == village_id
    ).order_by(Prediction.target_date.asc()).all()

    # Recent trips
    trips = db.query(Trip).filter(
        Trip.village_id == village_id
    ).order_by(Trip.created_at.desc()).limit(10).all()

    return {
        "village": {
            "id": village.id,
            "name": village.name,
            "district": village.district,
            "taluka": village.taluka,
            "latitude": village.latitude,
            "longitude": village.longitude,
            "population": village.population,
            "households": village.households,
            "primary_water_source": village.primary_water_source,
        },
        "wsi": wsi_data,
        "rainfall_history": [
            {"date": r.date.isoformat(), "actual": r.rainfall_mm, "normal": r.normal_rainfall_mm, "deviation": r.deviation_percent}
            for r in rainfall
        ],
        "groundwater_history": [
            {"date": r.date.isoformat(), "level": r.level_meters, "change": r.change_from_previous}
            for r in groundwater
        ],
        "predictions": [
            {"target_date": p.target_date.isoformat(), "predicted_wsi": p.predicted_wsi, "severity": p.predicted_severity, "demand": p.predicted_demand_liters, "confidence": p.confidence}
            for p in predictions
        ],
        "recent_trips": [
            {"id": t.id, "status": t.status, "quantity": t.quantity_liters, "scheduled": t.scheduled_at.isoformat() if t.scheduled_at else None, "completed": t.completed_at.isoformat() if t.completed_at else None}
            for t in trips
        ],
    }


# ═══════════════════════════════════════════
# PREDICTIONS
# ═══════════════════════════════════════════
@router.get("/predictions")
def get_predictions(
    days_ahead: int = Query(default=30, ge=7, le=90),
    db: Session = Depends(get_db)
):
    """Get drought predictions for all villages."""
    return drought_predictor.predict_all_villages(db, days_ahead)


@router.get("/predictions/district-summary")
def get_district_summary(
    days_ahead: int = Query(default=30, ge=7, le=90),
    db: Session = Depends(get_db)
):
    """Get aggregated predictions by district."""
    return drought_predictor.get_district_summary(db, days_ahead)


# ═══════════════════════════════════════════
# TANKERS
# ═══════════════════════════════════════════
@router.get("/tankers")
def get_tankers(db: Session = Depends(get_db)):
    """Get all tankers with status."""
    tankers = db.query(Tanker).all()
    return [
        {
            "id": t.id,
            "registration": t.registration_number,
            "capacity": t.capacity_liters,
            "driver_name": t.driver_name,
            "driver_phone": t.driver_phone,
            "status": t.status,
            "current_lat": t.current_latitude,
            "current_lng": t.current_longitude,
            "depot_lat": t.depot_latitude,
            "depot_lng": t.depot_longitude,
            "district": t.district,
        }
        for t in tankers
    ]


# ═══════════════════════════════════════════
# ALLOCATION
# ═══════════════════════════════════════════
@router.get("/allocation/priorities")
def get_priorities(
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get prioritized village list for tanker allocation."""
    return allocation_engine.get_prioritized_villages(db, limit)


@router.post("/allocation/auto-allocate")
def auto_allocate(db: Session = Depends(get_db)):
    """Auto-allocate available tankers to highest-priority villages."""
    return allocation_engine.allocate_tankers(db)


# ═══════════════════════════════════════════
# ROUTE OPTIMIZATION
# ═══════════════════════════════════════════
@router.post("/routes/optimize")
def optimize_tanker_routes(
    district: Optional[str] = None,
    num_vehicles: int = Query(default=3, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """Optimize routes for tanker dispatch in a district."""
    # Get priority villages
    priorities = allocation_engine.get_prioritized_villages(db, limit=15)

    if district:
        priorities = [p for p in priorities if p["district"] == district]

    if not priorities:
        return {"routes": [], "status": "no_villages_to_serve"}

    # Get depot location (first tanker's depot in district)
    tanker_query = db.query(Tanker).filter(Tanker.status == "available")
    if district:
        tanker_query = tanker_query.filter(Tanker.district == district)
    first_tanker = tanker_query.first()

    depot = {
        "lat": first_tanker.depot_latitude if first_tanker else 19.8762,
        "lng": first_tanker.depot_longitude if first_tanker else 75.3433,
        "name": f"{district or 'Main'} Depot"
    }

    # Prepare villages for optimizer
    villages_for_routing = []
    for p in priorities[:15]:
        v = db.query(Village).filter(Village.id == p["village_id"]).first()
        if v:
            villages_for_routing.append({
                "id": v.id,
                "name": v.name,
                "lat": v.latitude,
                "lng": v.longitude,
                "demand": p["recommended_liters"],
                "priority": p["priority_score"],
            })

    return optimize_routes(depot, villages_for_routing, num_vehicles)


# ═══════════════════════════════════════════
# SIMULATION (What-If)
# ═══════════════════════════════════════════
@router.post("/simulate")
def run_simulation(
    rainfall_change_pct: float = Query(default=-30, ge=-100, le=100),
    db: Session = Depends(get_db)
):
    """What-If simulation: how does a rainfall change affect WSI across all villages?"""
    villages = db.query(Village).all()
    results = []
    for v in villages:
        sim = wsi_calculator.simulate_wsi(db, v, rainfall_change_pct)
        results.append(sim)

    results.sort(key=lambda x: x["simulated_wsi"], reverse=True)

    # Summary
    original_critical = sum(1 for r in results if r["original_severity"] in ["critical", "emergency"])
    simulated_critical = sum(1 for r in results if r["simulated_severity"] in ["critical", "emergency"])

    return {
        "rainfall_change_pct": rainfall_change_pct,
        "villages": results,
        "summary": {
            "total_villages": len(results),
            "original_critical": original_critical,
            "simulated_critical": simulated_critical,
            "change_in_critical": simulated_critical - original_critical,
            "avg_original_wsi": round(sum(r["original_wsi"] for r in results) / len(results), 1) if results else 0,
            "avg_simulated_wsi": round(sum(r["simulated_wsi"] for r in results) / len(results), 1) if results else 0,
        },
    }


# ═══════════════════════════════════════════
# WATER REQUESTS (Gram Panchayat)
# ═══════════════════════════════════════════
@router.get("/requests")
def get_requests(
    status: Optional[str] = None,
    village_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get water requests."""
    query = db.query(WaterRequest)
    if status:
        query = query.filter(WaterRequest.status == status)
    if village_id:
        query = query.filter(WaterRequest.village_id == village_id)

    requests = query.order_by(WaterRequest.created_at.desc()).all()
    result = []
    for r in requests:
        village = db.query(Village).filter(Village.id == r.village_id).first()
        result.append({
            "id": r.id,
            "village_id": r.village_id,
            "village_name": village.name if village else "Unknown",
            "district": village.district if village else "Unknown",
            "requested_by": r.requested_by,
            "phone": r.phone,
            "urgency": r.urgency,
            "quantity_needed": r.quantity_needed_liters,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        })
    return result


@router.post("/requests")
def create_request(
    village_id: int,
    requested_by: str,
    phone: str,
    urgency: str = "medium",
    quantity_needed: int = 10000,
    reason: str = "",
    db: Session = Depends(get_db)
):
    """Submit a new water request from Gram Panchayat."""
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    request = WaterRequest(
        village_id=village_id,
        requested_by=requested_by,
        phone=phone,
        urgency=urgency,
        quantity_needed_liters=quantity_needed,
        reason=reason,
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return {"id": request.id, "status": "pending", "message": "Request submitted successfully"}


# ═══════════════════════════════════════════
# GRIEVANCES
# ═══════════════════════════════════════════
@router.get("/grievances")
def get_grievances(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get grievances."""
    query = db.query(Grievance)
    if status:
        query = query.filter(Grievance.status == status)

    grievances = query.order_by(Grievance.created_at.desc()).all()
    result = []
    for g in grievances:
        village = db.query(Village).filter(Village.id == g.village_id).first()
        result.append({
            "id": g.id,
            "village_id": g.village_id,
            "village_name": village.name if village else "Unknown",
            "submitted_by": g.submitted_by,
            "category": g.category,
            "description": g.description,
            "status": g.status,
            "resolution": g.resolution,
            "created_at": g.created_at.isoformat() if g.created_at else None,
            "resolved_at": g.resolved_at.isoformat() if g.resolved_at else None,
        })
    return result


@router.post("/grievances")
def create_grievance(
    village_id: int,
    submitted_by: str,
    phone: str,
    category: str,
    description: str,
    db: Session = Depends(get_db)
):
    """Submit a new grievance from Gram Panchayat."""
    grievance = Grievance(
        village_id=village_id,
        submitted_by=submitted_by,
        phone=phone,
        category=category,
        description=description,
        status="open",
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)
    return {"id": grievance.id, "status": "open", "message": "Grievance submitted successfully"}


# ═══════════════════════════════════════════
# TRIPS
# ═══════════════════════════════════════════
@router.get("/trips")
def get_trips(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get trip list."""
    query = db.query(Trip)
    if status:
        query = query.filter(Trip.status == status)
    trips = query.order_by(Trip.created_at.desc()).limit(50).all()

    result = []
    for t in trips:
        tanker = db.query(Tanker).filter(Tanker.id == t.tanker_id).first()
        village = db.query(Village).filter(Village.id == t.village_id).first()
        result.append({
            "id": t.id,
            "tanker": {
                "id": tanker.id if tanker else None,
                "registration": tanker.registration_number if tanker else None,
                "driver_name": tanker.driver_name if tanker else None,
            },
            "village": {
                "id": village.id if village else None,
                "name": village.name if village else None,
                "district": village.district if village else None,
            },
            "status": t.status,
            "quantity": t.quantity_liters,
            "priority_score": t.priority_score,
            "distance_km": t.route_distance_km,
            "duration_min": t.route_duration_min,
            "scheduled_at": t.scheduled_at.isoformat() if t.scheduled_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        })
    return result


# ═══════════════════════════════════════════
# AUTH (simplified for hackathon)
# ═══════════════════════════════════════════
@router.post("/auth/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    """Simple login. Returns user info + role."""
    import hashlib
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    user = db.query(User).filter(User.email == email, User.password_hash == pw_hash).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "village_id": user.village_id,
        "district": user.district,
    }


# ═══════════════════════════════════════════
# DISTRICTS
# ═══════════════════════════════════════════
@router.get("/districts")
def get_districts(db: Session = Depends(get_db)):
    """Get distinct districts."""
    districts = db.query(Village.district).distinct().all()
    return [d[0] for d in districts]
