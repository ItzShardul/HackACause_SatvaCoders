"""
Seed data generator for JalMitra.
Creates realistic Maharashtra Vidarbha region data for demo.
"""
import random
import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (
    Village, Tanker, WaterStressRecord, RainfallData,
    GroundwaterData, Trip, WaterRequest, Prediction, User, Grievance
)
import hashlib

# ─── Maharashtra Vidarbha Villages (Real coordinates) ───
VILLAGES_DATA = [
    # Amravati Division (Western Vidarbha) - High Stress
    {"name": "Yavatmal", "district": "Yavatmal", "taluka": "Yavatmal", "lat": 20.3888, "lng": 78.1204, "pop": 120000, "rainfall": 900},
    {"name": "Pusad", "district": "Yavatmal", "taluka": "Pusad", "lat": 19.9146, "lng": 77.5724, "pop": 52000, "rainfall": 880},
    {"name": "Wani", "district": "Yavatmal", "taluka": "Wani", "lat": 20.0570, "lng": 78.9580, "pop": 38000, "rainfall": 920},
    {"name": "Digras", "district": "Yavatmal", "taluka": "Digras", "lat": 20.1068, "lng": 77.7180, "pop": 28000, "rainfall": 850},
    {"name": "Darwha", "district": "Yavatmal", "taluka": "Darwha", "lat": 20.3218, "lng": 77.7696, "pop": 31000, "rainfall": 860},
    
    {"name": "Washim", "district": "Washim", "taluka": "Washim", "lat": 20.1108, "lng": 77.1330, "pop": 58000, "rainfall": 820},
    {"name": "Risod", "district": "Washim", "taluka": "Risod", "lat": 20.1008, "lng": 76.7666, "pop": 22000, "rainfall": 790},
    {"name": "Mangrulpir", "district": "Washim", "taluka": "Mangrulpir", "lat": 20.3128, "lng": 77.3444, "pop": 18000, "rainfall": 810},
    
    {"name": "Akola", "district": "Akola", "taluka": "Akola", "lat": 20.7096, "lng": 77.0075, "pop": 140000, "rainfall": 780},
    {"name": "Akot", "district": "Akola", "taluka": "Akot", "lat": 21.0981, "lng": 77.0536, "pop": 45000, "rainfall": 760},
    {"name": "Balapur", "district": "Akola", "taluka": "Balapur", "lat": 20.6571, "lng": 76.7749, "pop": 25000, "rainfall": 750},
    
    {"name": "Buldhana", "district": "Buldhana", "taluka": "Buldhana", "lat": 20.5293, "lng": 76.1852, "pop": 62000, "rainfall": 850},
    {"name": "Khamgaon", "district": "Buldhana", "taluka": "Khamgaon", "lat": 20.7079, "lng": 76.5707, "pop": 80000, "rainfall": 830},
    {"name": "Malkapur", "district": "Buldhana", "taluka": "Malkapur", "lat": 20.8870, "lng": 76.2220, "pop": 35000, "rainfall": 840},
    
    {"name": "Amravati", "district": "Amravati", "taluka": "Amravati", "lat": 20.9320, "lng": 77.7523, "pop": 175000, "rainfall": 880},
    {"name": "Achalpur", "district": "Amravati", "taluka": "Achalpur", "lat": 21.2572, "lng": 77.5097, "pop": 68000, "rainfall": 920},
    {"name": "Daryapur", "district": "Amravati", "taluka": "Daryapur", "lat": 20.9186, "lng": 77.3228, "pop": 28000, "rainfall": 820},
    
    # Nagpur Division (Eastern Vidarbha) - Moderate/Low Stress
    {"name": "Wardha", "district": "Wardha", "taluka": "Wardha", "lat": 20.7453, "lng": 78.6022, "pop": 55000, "rainfall": 1050},
    {"name": "Hinganghat", "district": "Wardha", "taluka": "Hinganghat", "lat": 20.3667, "lng": 78.8333, "pop": 42000, "rainfall": 1020},
    
    {"name": "Nagpur", "district": "Nagpur", "taluka": "Nagpur", "lat": 21.1458, "lng": 79.0882, "pop": 250000, "rainfall": 1100},
    {"name": "Ramtek", "district": "Nagpur", "taluka": "Ramtek", "lat": 21.3938, "lng": 79.3275, "pop": 22000, "rainfall": 1150},
    
    {"name": "Chandrapur", "district": "Chandrapur", "taluka": "Chandrapur", "lat": 19.9615, "lng": 79.2961, "pop": 95000, "rainfall": 1200},
    {"name": "Ballarpur", "district": "Chandrapur", "taluka": "Ballarpur", "lat": 19.8500, "lng": 79.3333, "pop": 30000, "rainfall": 1180},
    
    {"name": "Bhandara", "district": "Bhandara", "taluka": "Bhandara", "lat": 21.1667, "lng": 79.6500, "pop": 48000, "rainfall": 1250},
    {"name": "Gondia", "district": "Gondia", "taluka": "Gondia", "lat": 21.4631, "lng": 80.1953, "pop": 42000, "rainfall": 1300},
    {"name": "Gadchiroli", "district": "Gadchiroli", "taluka": "Gadchiroli", "lat": 20.1809, "lng": 80.0005, "pop": 28000, "rainfall": 1400},
]

WATER_SOURCES = ["Borewell", "Open Well", "River", "Reservoir", "Canal", "Handpump"]
TANKER_PREFIXES = ["MH-29", "MH-30", "MH-31", "MH-32", "MH-33", "MH-34", "MH-35", "MH-36", "MH-37", "MH-38", "MH-39", "MH-40", "MH-49"]


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
    """Seed the database with realistic demo data for Vidarbha."""

    # Check if already seeded
    if db.query(Village).count() > 0:
        print("Database already seeded. Skipping.")
        return

    print("🌱 Seeding JalMitra database with Vidarbha data...")

    # ─── 1. Create Villages ───
    villages = []
    for v in VILLAGES_DATA:
        village = Village(
            name=v["name"],
            district=v["district"],
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
    print(f"  ✅ Created {len(villages)} Vidarbha villages")

    # ─── 2. Create Users ───
    # District Collector (Yavatmal - Highest Stress)
    collector = User(
        name="Amol Deshmukh",
        email="collector@jalmitra.gov.in",
        password_hash=hashlib.sha256("admin123".encode()).hexdigest(),
        role="collector",
        phone="9876543210",
        district="Yavatmal",
    )
    db.add(collector)

    # Gram Panchayat users (one per village for first 10 villages)
    for i, v in enumerate(villages[:10]):
        gp_user = User(
            name=f"Sarpanch {v.name}",
            email=f"gp.{v.name.lower().replace(' ', '')}@jalmitra.gov.in",
            password_hash=hashlib.sha256("village123".encode()).hexdigest(),
            role="gram_panchayat",
            phone=f"98765{43210 + i}",
            village_id=v.id,
            district=v.district,
        )
        db.add(gp_user)
    db.flush()
    print("  ✅ Created users for Vidarbha districts")

    # ─── 3. Create Tankers ───
    tankers = []
    depots = [
        {"lat": 20.3888, "lng": 78.1204, "district": "Yavatmal"},
        {"lat": 20.7096, "lng": 77.0075, "district": "Akola"},
        {"lat": 20.1108, "lng": 77.1330, "district": "Washim"},
        {"lat": 20.5293, "lng": 76.1852, "district": "Buldhana"},
        {"lat": 20.9320, "lng": 77.7523, "district": "Amravati"},
        {"lat": 21.1458, "lng": 79.0882, "district": "Nagpur"},
    ]
    for i in range(25):
        depot = depots[i % len(depots)]
        tanker = Tanker(
            registration_number=f"{random.choice(TANKER_PREFIXES)}-{random.choice('ABCDEFGH')}{random.choice('ABCDEFGH')}-{random.randint(1000, 9999)}",
            capacity_liters=random.choice([10000, 12000, 15000, 20000]),
            driver_name=f"Driver {random.choice(['Sanjay', 'Rajesh', 'Vilas', 'Sunil', 'Anil', 'Nitin', 'Vijay', 'Pramod'])} {random.choice(['Wankhede', 'Thakre', 'Gawai', 'Raut', 'Mankar', 'Meshram', 'Bawankule'])}",
            driver_phone=f"91{random.randint(10000000, 99999999)}",
            status=random.choice(["available"] * 8 + ["on_trip"] * 5 + ["maintenance"]),
            current_latitude=depot["lat"] + random.uniform(-0.1, 0.1),
            current_longitude=depot["lng"] + random.uniform(-0.1, 0.1),
            depot_latitude=depot["lat"],
            depot_longitude=depot["lng"],
            district=depot["district"],
        )
        db.add(tanker)
        tankers.append(tanker)
    db.flush()
    print(f"  ✅ Created {len(tankers)} tankers for Vidarbha")

    # ─── 4. Create Rainfall Data (24 months) ───
    base_date = datetime(2024, 3, 1)
    for village in villages:
        for month_offset in range(24):
            date = base_date + timedelta(days=month_offset * 30)
            month = date.month
            # Monsoon pattern: June-Sept high, rest low
            if month in [6, 7, 8, 9]:
                normal = village.avg_annual_rainfall_mm * 0.22  # 22% per monsoon month
            elif month in [10, 11]:
                normal = village.avg_annual_rainfall_mm * 0.05
            else:
                normal = village.avg_annual_rainfall_mm * 0.02

            # Add drought pattern for 2025 especially in West Vidarbha
            drought_factor = 1.0
            if date.year == 2025 and month in [6, 7, 8, 9]:
                if village.district in ["Yavatmal", "Washim", "Akola", "Buldhana"]:
                    drought_factor = random.uniform(0.3, 0.6)  # 40-70% deficit
                else:
                    drought_factor = random.uniform(0.7, 0.9)  # 10-30% deficit

            actual = normal * drought_factor * random.uniform(0.6, 1.4)
            deviation = ((actual - normal) / normal * 100) if normal > 0 else 0

            db.add(RainfallData(
                village_id=village.id,
                date=date,
                rainfall_mm=round(actual, 1),
                normal_rainfall_mm=round(normal, 1),
                deviation_percent=round(deviation, 1),
            ))

    db.flush()
    print("  ✅ Created rainfall data with Vidarbha drought patterns")

    # ─── 5. Create Groundwater Data (24 months) ───
    for village in villages:
        # West Vidarbha has deeper groundwater
        base_level = random.uniform(12, 22) if village.district in ["Yavatmal", "Washim", "Akola"] else random.uniform(6, 14)
        for month_offset in range(24):
            date = base_date + timedelta(days=month_offset * 30)
            month = date.month
            # Groundwater rises during monsoon, drops otherwise
            seasonal_change = -0.4 if month in [1, 2, 3, 4, 5, 12] else 0.3 if month in [7, 8, 9] else -0.1
            # Declining trend in 2025
            if date.year == 2025:
                seasonal_change -= 0.3

            base_level += seasonal_change + random.uniform(-0.2, 0.2)
            base_level = max(3, min(40, base_level))

            db.add(GroundwaterData(
                village_id=village.id,
                date=date,
                level_meters=round(base_level, 1),
                change_from_previous=round(seasonal_change, 2),
            ))
    db.flush()
    print("  ✅ Created groundwater data for Vidarbha hydrogeology")

    # ─── 6. Create WSI Records (current + historical) ───
    for village in villages:
        # Calculate stress based on region
        if village.district in ["Yavatmal", "Washim", "Akola"]:
            rainfall_dev = random.uniform(-65, -30)
            gw_decline = random.uniform(30, 80)
            demand_hist = random.uniform(60, 95)
        else:
            rainfall_dev = random.uniform(-20, 10)
            gw_decline = random.uniform(5, 30)
            demand_hist = random.uniform(10, 40)
            
        pop_factor = min(village.population / 150000, 1.0) * 100

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
    print("  ✅ Created regionalized WSI records")

    # ─── 7. Create Trips (recent) ───
    statuses = ["delivered"] * 20 + ["in_transit"] * 5 + ["assigned"] * 10
    for i in range(35):
        status = random.choice(statuses)
        scheduled = datetime.utcnow() - timedelta(days=random.randint(0, 14))
        trip = Trip(
            tanker_id=random.choice(tankers).id,
            village_id=random.choice(villages[:15]).id, # Mostly stressed villages
            status=status,
            quantity_liters=random.choice([10000, 12000, 15000]),
            priority_score=round(random.uniform(40, 95), 1),
            scheduled_at=scheduled,
            started_at=scheduled + timedelta(hours=1) if status != "assigned" else None,
            completed_at=scheduled + timedelta(hours=3) if status == "delivered" else None,
            route_distance_km=round(random.uniform(15, 100), 1),
            route_duration_min=round(random.uniform(45, 180), 0),
        )
        db.add(trip)
    db.flush()
    print("  ✅ Created active tanker trips in Vidarbha")

    # ─── 8. Create Water Requests ───
    reasons = [
        "Borewells in farmer suicides belt dried up",
        "No rainy spells for 40 days",
        "Severe drinking water shortage in tribal pockets",
        "Lakes in Amravati division at dead storage",
        "Village wells depleted due to extreme heat",
        "Cotton belt water scarcity",
    ]
    for i in range(20):
        village = random.choice(villages)
        db.add(WaterRequest(
            village_id=village.id,
            requested_by=f"Sarpanch {village.name}",
            phone=f"98{random.randint(10000000, 99999999)}",
            urgency=random.choice(["medium", "high", "critical", "critical"]),
            quantity_needed_liters=random.choice([10000, 15000, 20000, 30000]),
            reason=random.choice(reasons),
            status=random.choice(["pending"] * 6 + ["approved"] * 4 + ["scheduled"] * 4 + ["completed"] * 6),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 7)),
        ))
    db.flush()
    print("  ✅ Created urgent water requests")

    # ─── 9. Create Predictions (30/60/90 days) ───
    for village in villages:
        current_wsi = db.query(WaterStressRecord).filter(
            WaterStressRecord.village_id == village.id
        ).order_by(WaterStressRecord.date.desc()).first()

        base_wsi = current_wsi.wsi_score if current_wsi else 50

        for days_ahead in [30, 60, 90]:
            # Stressed districts predict worse outcomes
            trend = random.uniform(2, 12) if village.district in ["Yavatmal", "Washim"] else random.uniform(-2, 5)
            predicted_wsi = min(100, max(0, base_wsi + trend))
            predicted_demand = int(village.population * predicted_wsi / 100 * 0.4)
            db.add(Prediction(
                village_id=village.id,
                prediction_date=datetime.utcnow(),
                target_date=datetime.utcnow() + timedelta(days=days_ahead),
                predicted_wsi=round(predicted_wsi, 1),
                predicted_severity=get_severity(predicted_wsi),
                predicted_demand_liters=predicted_demand,
                predicted_tanker_trips=max(1, predicted_demand // 12000),
                confidence=round(random.uniform(0.75, 0.98), 2),
                model_version="Vidarbha-V2.0",
            ))
    db.flush()
    print("  ✅ Created drought predictions for all Vidarbha districts")

    # ─── 10. Create Grievances ───
    for i in range(10):
        village = random.choice(villages)
        db.add(Grievance(
            village_id=village.id,
            submitted_by=f"Worker from {village.name}",
            phone=f"97{random.randint(10000000, 99999999)}",
            category=random.choice(["delay", "quality", "quantity"]),
            description=random.choice([
                "Tanker delayed due to heatwave conditions",
                "Delivered water quantity insufficient for cattle",
                "Scheduled tanker did not arrive in 48 hours",
                "Quality of water from local reservoir is poor",
            ]),
            status=random.choice(["open", "in_progress", "resolved"]),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10)),
        ))

    db.commit()
    print("  ✅ Created localized grievances")
    print("🎉 Database seeding with Vidarbha data complete!")
