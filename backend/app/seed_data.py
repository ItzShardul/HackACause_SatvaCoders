"""
Seed data generator for JalMitra.
Creates realistic Maharashtra Marathwada region data for demo.
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

# ─── Maharashtra Marathwada Villages (Real coordinates) ───
VILLAGES_DATA = [
    {"name": "Paithan", "district": "Chhatrapati Sambhajinagar", "taluka": "Paithan", "lat": 19.4767, "lng": 75.3850, "pop": 35207, "rainfall": 650},
    {"name": "Beed", "district": "Beed", "taluka": "Beed", "lat": 18.9891, "lng": 75.7601, "pop": 45332, "rainfall": 680},
    {"name": "Latur", "district": "Latur", "taluka": "Latur", "lat": 18.3968, "lng": 76.5604, "pop": 52000, "rainfall": 720},
    {"name": "Osmanabad", "district": "Dharashiv", "taluka": "Osmanabad", "lat": 18.1860, "lng": 76.0400, "pop": 41200, "rainfall": 700},
    {"name": "Jalna", "district": "Jalna", "taluka": "Jalna", "lat": 19.8347, "lng": 75.8816, "pop": 38500, "rainfall": 660},
    {"name": "Ambad", "district": "Jalna", "taluka": "Ambad", "lat": 19.6100, "lng": 75.9500, "pop": 18200, "rainfall": 620},
    {"name": "Parli", "district": "Beed", "taluka": "Parli", "lat": 18.8500, "lng": 76.5300, "pop": 22000, "rainfall": 640},
    {"name": "Udgir", "district": "Latur", "taluka": "Udgir", "lat": 18.3930, "lng": 77.1160, "pop": 28300, "rainfall": 710},
    {"name": "Nanded", "district": "Nanded", "taluka": "Nanded", "lat": 19.1383, "lng": 77.3210, "pop": 55000, "rainfall": 850},
    {"name": "Hingoli", "district": "Hingoli", "taluka": "Hingoli", "lat": 19.7150, "lng": 77.1500, "pop": 23000, "rainfall": 780},
    {"name": "Kaij", "district": "Beed", "taluka": "Kaij", "lat": 18.8500, "lng": 75.9800, "pop": 14500, "rainfall": 590},
    {"name": "Georai", "district": "Beed", "taluka": "Georai", "lat": 19.2600, "lng": 75.7300, "pop": 16200, "rainfall": 610},
    {"name": "Majalgaon", "district": "Beed", "taluka": "Majalgaon", "lat": 19.1600, "lng": 76.2100, "pop": 19000, "rainfall": 630},
    {"name": "Ashti", "district": "Beed", "taluka": "Ashti", "lat": 18.9900, "lng": 76.1700, "pop": 12300, "rainfall": 600},
    {"name": "Patoda", "district": "Beed", "taluka": "Patoda", "lat": 19.2200, "lng": 75.5500, "pop": 9800, "rainfall": 570},
    {"name": "Shirur Kasar", "district": "Beed", "taluka": "Shirur", "lat": 19.3100, "lng": 75.9300, "pop": 8500, "rainfall": 560},
    {"name": "Wadwani", "district": "Beed", "taluka": "Wadwani", "lat": 18.7100, "lng": 76.0500, "pop": 7400, "rainfall": 580},
    {"name": "Dharur", "district": "Beed", "taluka": "Dharur", "lat": 18.8200, "lng": 76.2800, "pop": 11100, "rainfall": 595},
    {"name": "Nilanga", "district": "Latur", "taluka": "Nilanga", "lat": 18.1200, "lng": 76.7500, "pop": 24800, "rainfall": 690},
    {"name": "Ausa", "district": "Latur", "taluka": "Ausa", "lat": 18.2400, "lng": 76.5000, "pop": 19500, "rainfall": 670},
    {"name": "Chakur", "district": "Latur", "taluka": "Chakur", "lat": 18.5200, "lng": 76.5100, "pop": 13200, "rainfall": 660},
    {"name": "Renapur", "district": "Latur", "taluka": "Renapur", "lat": 18.5000, "lng": 76.6200, "pop": 11500, "rainfall": 650},
    {"name": "Deoni", "district": "Latur", "taluka": "Deoni", "lat": 18.6400, "lng": 76.8800, "pop": 10200, "rainfall": 640},
    {"name": "Tuljapur", "district": "Dharashiv", "taluka": "Tuljapur", "lat": 18.0100, "lng": 76.0700, "pop": 27600, "rainfall": 710},
    {"name": "Omerga", "district": "Dharashiv", "taluka": "Omerga", "lat": 17.8600, "lng": 76.2200, "pop": 21000, "rainfall": 680},
    {"name": "Paranda", "district": "Dharashiv", "taluka": "Paranda", "lat": 18.3800, "lng": 75.8900, "pop": 13200, "rainfall": 630},
    {"name": "Bhoom", "district": "Dharashiv", "taluka": "Bhoom", "lat": 18.4700, "lng": 75.7500, "pop": 9800, "rainfall": 610},
    {"name": "Kalamb", "district": "Dharashiv", "taluka": "Kalamb", "lat": 18.1200, "lng": 76.2000, "pop": 15600, "rainfall": 660},
    {"name": "Washi", "district": "Dharashiv", "taluka": "Washi", "lat": 18.2900, "lng": 76.1700, "pop": 8200, "rainfall": 620},
    {"name": "Gangakhed", "district": "Chhatrapati Sambhajinagar", "taluka": "Gangakhed", "lat": 18.9700, "lng": 76.7500, "pop": 16500, "rainfall": 640},
    {"name": "Sillod", "district": "Chhatrapati Sambhajinagar", "taluka": "Sillod", "lat": 20.3000, "lng": 75.6500, "pop": 25300, "rainfall": 690},
    {"name": "Vaijapur", "district": "Chhatrapati Sambhajinagar", "taluka": "Vaijapur", "lat": 19.9200, "lng": 74.7300, "pop": 21000, "rainfall": 600},
    {"name": "Kannad", "district": "Chhatrapati Sambhajinagar", "taluka": "Kannad", "lat": 20.2700, "lng": 75.1400, "pop": 17800, "rainfall": 630},
    {"name": "Phulambri", "district": "Chhatrapati Sambhajinagar", "taluka": "Phulambri", "lat": 20.1100, "lng": 75.5200, "pop": 11200, "rainfall": 620},
    {"name": "Khuldabad", "district": "Chhatrapati Sambhajinagar", "taluka": "Khuldabad", "lat": 20.0900, "lng": 75.1900, "pop": 9600, "rainfall": 610},
    {"name": "Soygaon", "district": "Chhatrapati Sambhajinagar", "taluka": "Soygaon", "lat": 20.4700, "lng": 75.4100, "pop": 7200, "rainfall": 590},
    {"name": "Naigaon", "district": "Nanded", "taluka": "Naigaon", "lat": 19.2000, "lng": 77.3900, "pop": 12800, "rainfall": 750},
    {"name": "Deglur", "district": "Nanded", "taluka": "Deglur", "lat": 18.5300, "lng": 77.3900, "pop": 18000, "rainfall": 780},
    {"name": "Mukhed", "district": "Nanded", "taluka": "Mukhed", "lat": 18.6700, "lng": 77.1600, "pop": 14100, "rainfall": 760},
    {"name": "Ardhapur", "district": "Nanded", "taluka": "Ardhapur", "lat": 19.1800, "lng": 77.0700, "pop": 9500, "rainfall": 740},
    {"name": "Hadgaon", "district": "Nanded", "taluka": "Hadgaon", "lat": 19.5000, "lng": 77.6500, "pop": 11800, "rainfall": 770},
    {"name": "Kandhar", "district": "Nanded", "taluka": "Kandhar", "lat": 18.8500, "lng": 77.0900, "pop": 15200, "rainfall": 750},
    {"name": "Loha", "district": "Nanded", "taluka": "Loha", "lat": 18.9700, "lng": 77.3800, "pop": 10600, "rainfall": 730},
    {"name": "Basmath", "district": "Hingoli", "taluka": "Basmath", "lat": 19.3200, "lng": 77.0300, "pop": 17800, "rainfall": 760},
    {"name": "Sengaon", "district": "Hingoli", "taluka": "Sengaon", "lat": 19.5900, "lng": 76.7900, "pop": 10200, "rainfall": 720},
    {"name": "Kalamnuri", "district": "Hingoli", "taluka": "Kalamnuri", "lat": 19.6800, "lng": 77.3200, "pop": 12500, "rainfall": 740},
    {"name": "Aundha Nagnath", "district": "Hingoli", "taluka": "Aundha", "lat": 19.4700, "lng": 76.9600, "pop": 8900, "rainfall": 710},
    {"name": "Ghansawangi", "district": "Jalna", "taluka": "Ghansawangi", "lat": 19.6300, "lng": 76.2200, "pop": 11600, "rainfall": 640},
    {"name": "Bhokardan", "district": "Jalna", "taluka": "Bhokardan", "lat": 20.0000, "lng": 75.7800, "pop": 14800, "rainfall": 620},
    {"name": "Jafrabad", "district": "Jalna", "taluka": "Jafrabad", "lat": 19.7600, "lng": 75.9200, "pop": 10300, "rainfall": 610},
]

WATER_SOURCES = ["Borewell", "Open Well", "River", "Reservoir", "Canal", "Handpump"]
TANKER_PREFIXES = ["MH-20", "MH-24", "MH-26", "MH-31", "MH-14"]


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
    """Seed the database with realistic demo data."""

    # Check if already seeded
    if db.query(Village).count() > 0:
        print("Database already seeded. Skipping.")
        return

    print("🌱 Seeding JalMitra database...")

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
    print(f"  ✅ Created {len(villages)} villages")

    # ─── 2. Create Users ───
    # District Collector
    collector = User(
        name="Rajesh Sharma",
        email="collector@jalmitra.gov.in",
        password_hash=hashlib.sha256("admin123".encode()).hexdigest(),
        role="collector",
        phone="9876543210",
        district="Beed",
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
    print("  ✅ Created users")

    # ─── 3. Create Tankers ───
    tankers = []
    depots = [
        {"lat": 19.8762, "lng": 75.3433, "district": "Chhatrapati Sambhajinagar"},
        {"lat": 18.9891, "lng": 75.7601, "district": "Beed"},
        {"lat": 18.3968, "lng": 76.5604, "district": "Latur"},
        {"lat": 18.1860, "lng": 76.0400, "district": "Dharashiv"},
        {"lat": 19.8347, "lng": 75.8816, "district": "Jalna"},
        {"lat": 19.1383, "lng": 77.3210, "district": "Nanded"},
    ]
    for i in range(20):
        depot = depots[i % len(depots)]
        tanker = Tanker(
            registration_number=f"{random.choice(TANKER_PREFIXES)}-{random.choice('ABCDEFGH')}{random.choice('ABCDEFGH')}-{random.randint(1000, 9999)}",
            capacity_liters=random.choice([5000, 10000, 12000, 15000, 20000]),
            driver_name=f"Driver {random.choice(['Suresh', 'Ramesh', 'Ganesh', 'Mahesh', 'Dinesh', 'Rakesh', 'Prakash', 'Santosh'])} {random.choice(['Patil', 'Jadhav', 'Pawar', 'More', 'Shinde', 'Deshmukh', 'Gaikwad'])}",
            driver_phone=f"97{random.randint(10000000, 99999999)}",
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
    print(f"  ✅ Created {len(tankers)} tankers")

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

            # Add drought pattern for 2025
            drought_factor = 1.0
            if date.year == 2025 and month in [6, 7, 8, 9]:
                drought_factor = random.uniform(0.3, 0.7)  # 30-70% deficit

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
    print("  ✅ Created rainfall data (24 months)")

    # ─── 5. Create Groundwater Data (24 months) ───
    for village in villages:
        base_level = random.uniform(8, 18)
        for month_offset in range(24):
            date = base_date + timedelta(days=month_offset * 30)
            month = date.month
            # Groundwater rises during monsoon, drops otherwise
            seasonal_change = -0.3 if month in [1, 2, 3, 4, 5, 12] else 0.2 if month in [7, 8, 9] else -0.1
            # Declining trend in 2025
            if date.year == 2025:
                seasonal_change -= 0.2

            base_level += seasonal_change + random.uniform(-0.2, 0.2)
            base_level = max(3, min(30, base_level))

            db.add(GroundwaterData(
                village_id=village.id,
                date=date,
                level_meters=round(base_level, 1),
                change_from_previous=round(seasonal_change, 2),
            ))
    db.flush()
    print("  ✅ Created groundwater data (24 months)")

    # ─── 6. Create WSI Records (current + historical) ───
    for village in villages:
        rainfall_dev = random.uniform(-60, 10)  # negative = deficit
        gw_decline = random.uniform(0, 40)
        pop_factor = min(village.population / 50000, 1.0) * 100
        demand_hist = random.uniform(20, 80)

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
    print("  ✅ Created WSI records")

    # ─── 7. Create Trips (recent) ───
    statuses = ["delivered"] * 15 + ["in_transit"] * 3 + ["assigned"] * 5
    for i in range(23):
        status = statuses[i]
        scheduled = datetime.utcnow() - timedelta(days=random.randint(0, 14))
        trip = Trip(
            tanker_id=random.choice(tankers).id,
            village_id=random.choice(villages).id,
            status=status,
            quantity_liters=random.choice([5000, 10000, 12000, 15000]),
            priority_score=round(random.uniform(40, 95), 1),
            scheduled_at=scheduled,
            started_at=scheduled + timedelta(hours=1) if status != "assigned" else None,
            completed_at=scheduled + timedelta(hours=3) if status == "delivered" else None,
            route_distance_km=round(random.uniform(10, 80), 1),
            route_duration_min=round(random.uniform(30, 150), 0),
        )
        db.add(trip)
    db.flush()
    print("  ✅ Created trips")

    # ─── 8. Create Water Requests ───
    for i in range(15):
        village = random.choice(villages)
        db.add(WaterRequest(
            village_id=village.id,
            requested_by=f"Sarpanch {village.name}",
            phone=f"98{random.randint(10000000, 99999999)}",
            urgency=random.choice(["low", "medium", "high", "critical"]),
            quantity_needed_liters=random.choice([5000, 10000, 15000, 20000]),
            reason=random.choice([
                "Borewell dried up",
                "No rainfall for 3 months",
                "Drinking water shortage",
                "Livestock water needed",
                "Village well contaminated",
                "Pipeline repair ongoing",
            ]),
            status=random.choice(["pending"] * 5 + ["approved"] * 3 + ["scheduled"] * 2 + ["completed"] * 3),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10)),
        ))
    db.flush()
    print("  ✅ Created water requests")

    # ─── 9. Create Predictions (30/60/90 days) ───
    for village in villages:
        current_wsi = db.query(WaterStressRecord).filter(
            WaterStressRecord.village_id == village.id
        ).order_by(WaterStressRecord.date.desc()).first()

        base_wsi = current_wsi.wsi_score if current_wsi else 50

        for days_ahead in [30, 60, 90]:
            predicted_wsi = min(100, max(0, base_wsi + random.uniform(-5, 15)))
            predicted_demand = int(village.population * predicted_wsi / 100 * 0.5)
            db.add(Prediction(
                village_id=village.id,
                prediction_date=datetime.utcnow(),
                target_date=datetime.utcnow() + timedelta(days=days_ahead),
                predicted_wsi=round(predicted_wsi, 1),
                predicted_severity=get_severity(predicted_wsi),
                predicted_demand_liters=predicted_demand,
                predicted_tanker_trips=max(1, predicted_demand // 10000),
                confidence=round(random.uniform(0.7, 0.95), 2),
                model_version="v1.0",
            ))
    db.flush()
    print("  ✅ Created predictions")

    # ─── 10. Create Grievances ───
    for i in range(8):
        village = random.choice(villages)
        db.add(Grievance(
            village_id=village.id,
            submitted_by=f"Villager from {village.name}",
            phone=f"97{random.randint(10000000, 99999999)}",
            category=random.choice(["delay", "quality", "quantity", "other"]),
            description=random.choice([
                "Tanker did not arrive on scheduled date",
                "Water quality was poor - muddy water delivered",
                "Only half the quantity was delivered",
                "Tanker arrived 6 hours late",
                "No response to our water request for 5 days",
                "Regular supply stopped without notice",
            ]),
            status=random.choice(["open", "in_progress", "resolved"]),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 15)),
        ))

    db.commit()
    print("  ✅ Created grievances")
    print("🎉 Database seeding complete!")
