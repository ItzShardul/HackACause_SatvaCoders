"""
Seed data generator for JalMitra.
Focused exclusively on Nagpur District and its 14 Talukas for the Smart Pilot.
"""
import random
import math
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (
    Village, Tanker, WaterStressRecord, RainfallData,
    GroundwaterData, Trip, WaterRequest, Prediction, User, Grievance
)

# ─── Nagpur District - 14 Talukas (Realistic coordinates) ───
VILLAGES_DATA = [
    {"name": "Nagpur Urban", "district": "Nagpur", "taluka": "Nagpur Urban", "lat": 21.1458, "lng": 79.0882, "pop": 2500000, "rainfall": 1100},
    {"name": "Nagpur Rural", "district": "Nagpur", "taluka": "Nagpur Rural", "lat": 21.1000, "lng": 79.0500, "pop": 650000, "rainfall": 1080},
    {"name": "Kamptee", "district": "Nagpur", "taluka": "Kamptee", "lat": 21.2227, "lng": 79.2014, "pop": 84300, "rainfall": 1120},
    {"name": "Hingna", "district": "Nagpur", "taluka": "Hingna", "lat": 21.0667, "lng": 78.9667, "pop": 24600, "rainfall": 1050},
    {"name": "Katol", "district": "Nagpur", "taluka": "Katol", "lat": 21.2682, "lng": 78.5833, "pop": 42100, "rainfall": 980},
    {"name": "Narkhed", "district": "Nagpur", "taluka": "Narkhed", "lat": 21.4667, "lng": 78.5333, "pop": 21500, "rainfall": 950},
    {"name": "Savner", "district": "Nagpur", "taluka": "Savner", "lat": 21.3917, "lng": 78.9167, "pop": 31200, "rainfall": 1020},
    {"name": "Kalmeshwar", "district": "Nagpur", "taluka": "Kalmeshwar", "lat": 21.2333, "lng": 78.9167, "pop": 18200, "rainfall": 1040},
    {"name": "Ramtek", "district": "Nagpur", "taluka": "Ramtek", "lat": 21.3938, "lng": 79.3275, "pop": 22400, "rainfall": 1150},
    {"name": "Parseoni", "district": "Nagpur", "taluka": "Parseoni", "lat": 21.3833, "lng": 79.1667, "pop": 15300, "rainfall": 1100},
    {"name": "Mauda", "district": "Nagpur", "taluka": "Mauda", "lat": 21.1667, "lng": 79.4333, "pop": 12500, "rainfall": 1200},
    {"name": "Umred", "district": "Nagpur", "taluka": "Umred", "lat": 20.8500, "lng": 79.3333, "pop": 45600, "rainfall": 1180},
    {"name": "Kuhi", "district": "Nagpur", "taluka": "Kuhi", "lat": 21.0167, "lng": 79.3667, "pop": 11200, "rainfall": 1250},
    {"name": "Bhiwapur", "district": "Nagpur", "taluka": "Bhiwapur", "lat": 20.7667, "lng": 79.5167, "pop": 14200, "rainfall": 1300},
]

WATER_SOURCES = ["Borewell", "Open Well", "River", "Reservoir", "Canal", "Handpump"]
TANKER_PREFIXES = ["MH-31", "MH-40", "MH-49"] # Nagpur specific registration prefixes


def get_severity(wsi: float) -> str:
    if wsi < 20:
        return "normal"
    elif wsi < 40:
        return "watch"
    elif wsi < 60:
        return "warning"
    elif wsi < 80:
        return "critical"
    return "emergency"


def seed_database(db: Session):
    """Seed the database with realistic demo data for Nagpur Pilot."""

    # Check if already seeded
    if db.query(Village).count() > 0:
        print("Database already seeded. Skipping.")
        return

    print("🌱 Seeding JalMitra database with Nagpur Pilot data...")

    # ─── 1. Create Villages ───
    villages = []
    for v in VILLAGES_DATA:
        village = Village(
            name=v["name"],
            district="Nagpur",
            taluka=v["taluka"],
            state="Maharashtra",
            latitude=v["lat"],
            longitude=v["lng"],
            population=v["pop"],
            households=v["pop"] // 5,
            primary_water_source=random.choice(WATER_SOURCES),
            groundwater_level=round(random.uniform(5, 25), 1),
            last_rainfall_mm=round(random.uniform(200, 800), 1),
            avg_annual_rainfall_mm=v["rainfall"],
        )
        db.add(village)
        villages.append(village)
    db.flush()
    print(f"  ✅ Created {len(villages)} Nagpur taluka units")

    # ─── 2. Create Users ───
    # District Collector (Nagpur Admin)
    collector = User(
        name="Nagpur Admin",
        email="collector.nagpur@jalmitra.gov.in",
        password_hash=hashlib.sha256("admin123".encode()).hexdigest(),
        role="collector",
        phone="9876543210",
        district="Nagpur",
    )
    db.add(collector)

    # Gram Panchayat users (one per taluka village)
    for i, v in enumerate(villages):
        gp_user = User(
            name=f"Sarpanch {v.name}",
            email=f"gp.{v.name.lower().replace(' ', '')}@jalmitra.gov.in",
            password_hash=hashlib.sha256("village123".encode()).hexdigest(),
            role="gram_panchayat",
            phone=f"98765{43210 + i}",
            village_id=v.id,
            district="Nagpur",
        )
        db.add(gp_user)
    db.flush()
    print("  ✅ Created administrative users for Nagpur Pilot")

    # ─── 3. Create Tankers ───
    tankers = []
    # Major depot in Nagpur City
    depot_lat, depot_lng = 21.1458, 79.0882
    for i in range(20):
        tanker = Tanker(
            registration_number=f"{random.choice(TANKER_PREFIXES)}-TR-{random.randint(1000, 9999)}",
            capacity_liters=random.choice([10000, 12000, 15000, 20000]),
            driver_name=f"Driver {random.choice(['Sachin', 'Vijay', 'Amol', 'Rahul', 'Sanjay', 'Santosh'])} {random.choice(['Tayade', 'Deshmukh', 'Patil', 'Wankhede', 'Gondane', 'Patil'])}",
            driver_phone="8459468626", # Using consistent demo phone
            status=random.choice(["available"] * 8 + ["on_trip"] * 5 + ["maintenance"]),
            current_latitude=depot_lat + random.uniform(-0.05, 0.05),
            current_longitude=depot_lng + random.uniform(-0.05, 0.05),
            depot_latitude=depot_lat,
            depot_longitude=depot_lng,
            district="Nagpur",
        )
        db.add(tanker)
        tankers.append(tanker)
    db.flush()
    print(f"  ✅ Created {len(tankers)} tankers for Nagpur Fleet")

    # ─── 4. Create Rainfall Data (24 months) ───
    base_date = datetime(2024, 3, 1)
    for village in villages:
        for month_offset in range(24):
            date = base_date + timedelta(days=month_offset * 30)
            month = date.month
            if month in [6, 7, 8, 9]:
                normal = village.avg_annual_rainfall_mm * 0.22 
            elif month in [10, 11]:
                normal = village.avg_annual_rainfall_mm * 0.05
            else:
                normal = village.avg_annual_rainfall_mm * 0.02

            # Simulate deficit in Katol/Narkhed (Citrus belt)
            drought_factor = 1.0
            if date.year == 2025 and month in [6, 7, 8, 9]:
                if village.taluka in ["Katol", "Narkhed", "Bhiwapur"]:
                    drought_factor = random.uniform(0.4, 0.6)
                else:
                    drought_factor = random.uniform(0.7, 0.9)

            actual = normal * drought_factor * random.uniform(0.8, 1.2)
            deviation = ((actual - normal) / normal * 100) if normal > 0 else 0

            db.add(RainfallData(
                village_id=village.id,
                date=date,
                rainfall_mm=round(actual, 1),
                normal_rainfall_mm=round(normal, 1),
                deviation_percent=round(deviation, 1),
            ))

    db.flush()
    print("  ✅ Created rainfall data with Nagpur-specific trends")

    # ─── 5. Create Groundwater Data (24 months) ───
    for village in villages:
        base_level = random.uniform(10, 18) if village.taluka in ["Katol", "Narkhed"] else random.uniform(5, 12)
        for month_offset in range(24):
            date = base_date + timedelta(days=month_offset * 30)
            month = date.month
            seasonal_change = -0.5 if month in [3, 4, 5] else 0.4 if month in [7, 8, 9] else -0.1
            if date.year == 2025:
                seasonal_change -= 0.2

            base_level += seasonal_change + random.uniform(-0.1, 0.1)
            base_level = max(2, min(45, base_level))

            db.add(GroundwaterData(
                village_id=village.id,
                date=date,
                level_meters=round(base_level, 1),
                change_from_previous=round(seasonal_change, 2),
            ))
    db.flush()
    print("  ✅ Created groundwater data for Nagpur hydrogeology")

    # ─── 6. Create WSI Records ───
    for village in villages:
        if village.taluka in ["Katol", "Narkhed", "Bhiwapur", "Umred"]:
            rainfall_dev = random.uniform(-55, -30)
            gw_decline = random.uniform(35, 75)
            demand_hist = random.uniform(65, 90)
        else:
            rainfall_dev = random.uniform(-15, 5)
            gw_decline = random.uniform(5, 25)
            demand_hist = random.uniform(5, 30)
            
        pop_factor = min(village.population / 100000, 1.0) * 100

        wsi = (
            abs(rainfall_dev) * 0.35 +
            gw_decline * 0.30 +
            pop_factor * 0.15 +
            demand_hist * 0.20
        )
        wsi = min(100, max(0, wsi))

        db.add(WaterStressRecord(
            village_id=village.id,
            date=datetime.utcnow(),
            wsi_score=round(wsi, 1),
            severity=get_severity(wsi),
            rainfall_deviation=round(rainfall_dev, 1),
            groundwater_decline=round(gw_decline, 1),
            demand_factor=round(demand_hist, 1),
            components={
                "rainfall_weight": 0.35,
                "groundwater_weight": 0.30,
                "population_weight": 0.15,
                "demand_weight": 0.20,
                "rainfall_deviation": round(rainfall_dev, 1),
                "groundwater_decline": round(gw_decline, 1),
                "population_factor": round(pop_factor, 1),
                "historical_demand": round(demand_hist, 1),
            },
        ))
    db.flush()
    print("  ✅ Created WSI records for Nagpur Pilot")

    # ─── 7. Create Recent Activity ───
    for i in range(20):
        village = random.choice(villages)
        status = random.choice(["delivered", "in_transit", "assigned"])
        scheduled = datetime.utcnow() - timedelta(days=random.randint(0, 5))
        db.add(Trip(
            tanker_id=random.choice(tankers).id,
            village_id=village.id,
            status=status,
            quantity_liters=random.choice([10000, 12000, 15000]),
            priority_score=round(random.uniform(50, 98), 1),
            scheduled_at=scheduled,
            started_at=scheduled + timedelta(hours=1) if status != "assigned" else None,
            completed_at=scheduled + timedelta(hours=3) if status == "delivered" else None,
            route_distance_km=round(random.uniform(10, 60), 1),
            route_duration_min=round(random.uniform(30, 120), 0),
        ))
    
    # Water Requests
    for i in range(12):
        village = random.choice(villages)
        db.add(WaterRequest(
            village_id=village.id,
            requested_by=f"Sarpanch {village.name}",
            phone="8459468626",
            urgency=random.choice(["high", "critical", "critical"]),
            quantity_needed_liters=random.choice([10000, 15000, 20000]),
            reason="Citrus belt drying up. Immediate tanker support required for human consumption.",
            status=random.choice(["pending", "approved", "scheduled", "completed"]),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 3)),
        ))

    # ─── 8. Create Predictions (30/60/90 days) ───
    for village in villages:
        current_wsi_rec = db.query(WaterStressRecord).filter(WaterStressRecord.village_id == village.id).first()
        base_wsi = current_wsi_rec.wsi_score if current_wsi_rec else 50

        for days_ahead in [30, 60, 90]:
            trend = random.uniform(4, 15) if village.taluka in ["Katol", "Narkhed", "Bhiwapur"] else random.uniform(-1, 6)
            predicted_wsi = min(100, max(0, base_wsi + trend))
            predicted_demand = int(village.population * predicted_wsi / 100 * 0.35)
            db.add(Prediction(
                village_id=village.id,
                prediction_date=datetime.utcnow(),
                target_date=datetime.utcnow() + timedelta(days=days_ahead),
                predicted_wsi=round(predicted_wsi, 1),
                predicted_severity=get_severity(predicted_wsi),
                predicted_demand_liters=predicted_demand,
                predicted_tanker_trips=max(1, predicted_demand // 12000),
                confidence=round(random.uniform(0.82, 0.98), 2),
                model_version="Nagpur-Pilot-V1.0",
            ))

    # ─── 9. Create Grievances ───
    for i in range(8):
        village = random.choice(villages)
        db.add(Grievance(
            village_id=village.id,
            submitted_by=f"Resident of {village.name}",
            phone="8459468626",
            category=random.choice(["delay", "quantity"]),
            description="Tanker arrival delayed beyond 24 hours. Emergency water stock exhausted.",
            status=random.choice(["open", "in_progress", "resolved"]),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
        ))

    db.commit()
    print("🎉 Database successfully seeded for Nagpur District Pilot!")
