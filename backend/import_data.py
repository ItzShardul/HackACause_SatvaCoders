"""
JalMitra Data Importer
Reads CSVs from backend/data/ folder and populates the database.
Run: python import_data.py

Supports:
  - villages.csv
  - rainfall.csv
  - groundwater.csv
  - tankers.csv
"""
import csv
import os
import sys
from datetime import datetime

# Make sure app modules are importable
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models import Base, Village, RainfallData, GroundwaterData, Tanker, WaterStressRecord
from app.ml.wsi_calculator import WSICalculator

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
calculator = WSICalculator()


def load_csv(filename: str):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"  ⚠️  {filename} not found — skipping")
        return []
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def import_villages(db):
    rows = load_csv("villages.csv")
    if not rows:
        return 0

    # Clear existing villages
    db.query(Village).delete()
    db.commit()

    count = 0
    for r in rows:
        v = Village(
            name=r["village_name"].strip(),
            district=r["district"].strip(),
            taluka=r.get("taluka", "").strip(),
            latitude=float(r["latitude"]),
            longitude=float(r["longitude"]),
            population=int(r["population"]),
            primary_water_source=r.get("primary_water_source", "borewell").strip(),
        )
        db.add(v)
        count += 1

    db.commit()
    print(f"  ✅ Imported {count} villages")
    return count


def import_rainfall(db):
    rows = load_csv("rainfall.csv")
    if not rows:
        return 0

    db.query(RainfallData).delete()
    db.commit()

    count = 0
    for r in rows:
        # Find matching village (first village in that district)
        village = db.query(Village).filter(
            Village.district == r["district"].strip()
        ).first()
        if not village:
            continue

        month = int(r["month"])
        year = int(r["year"])
        rec = RainfallData(
            village_id=village.id,
            date=datetime(year, month, 1),
            rainfall_mm=float(r["rainfall_mm"]),
            normal_rainfall_mm=float(r.get("normal_mm", r["rainfall_mm"])),
        )
        db.add(rec)
        count += 1

    db.commit()
    print(f"  ✅ Imported {count} rainfall records")
    return count


def import_groundwater(db):
    rows = load_csv("groundwater.csv")
    if not rows:
        return 0

    db.query(GroundwaterData).delete()
    db.commit()

    season_month = {"pre_monsoon": 5, "post_monsoon": 10, "rabi": 1, "kharif": 8}
    count = 0

    for r in rows:
        village = db.query(Village).filter(
            Village.district == r["district"].strip()
        ).first()
        if not village:
            continue

        season = r.get("season", "pre_monsoon").strip()
        month = season_month.get(season, 5)
        year = int(r["year"])

        rec = GroundwaterData(
            village_id=village.id,
            date=datetime(year, month, 1),
            depth_meters=float(r["depth_meters"]),
            quality_tds=None,
        )
        db.add(rec)
        count += 1

    db.commit()
    print(f"  ✅ Imported {count} groundwater records")
    return count


def import_tankers(db):
    rows = load_csv("tankers.csv")
    if not rows:
        return 0

    db.query(Tanker).delete()
    db.commit()

    count = 0
    for r in rows:
        t = Tanker(
            registration=r["registration"].strip(),
            capacity_liters=int(r["capacity_liters"]),
            driver_name=r.get("driver_name", "").strip(),
            driver_phone=r.get("driver_phone", "").strip(),
            status=r.get("status", "available").strip(),
            current_district=r.get("base_district", "").strip(),
        )
        db.add(t)
        count += 1

    db.commit()
    print(f"  ✅ Imported {count} tankers")
    return count


def recalculate_wsi(db):
    """Recalculate Water Stress Index for all villages using imported data."""
    villages = db.query(Village).all()
    count = 0

    for village in villages:
        # Get latest rainfall
        rainfall_records = (
            db.query(RainfallData)
            .filter(RainfallData.village_id == village.id)
            .order_by(RainfallData.date.desc())
            .limit(12)
            .all()
        )
        # Get latest groundwater
        gw_records = (
            db.query(GroundwaterData)
            .filter(GroundwaterData.village_id == village.id)
            .order_by(GroundwaterData.date.desc())
            .limit(4)
            .all()
        )

        if not rainfall_records:
            continue

        avg_rainfall = sum(r.rainfall_mm for r in rainfall_records) / len(rainfall_records)
        avg_normal = sum(r.normal_rainfall_mm for r in rainfall_records) / len(rainfall_records)
        avg_gw = sum(r.depth_meters for r in gw_records) / len(gw_records) if gw_records else 12.0

        wsi_data = calculator.calculate(
            rainfall_mm=avg_rainfall,
            normal_rainfall_mm=avg_normal,
            groundwater_depth=avg_gw,
            population=village.population,
            demand_met_pct=65.0,
        )

        existing = db.query(WaterStressRecord).filter(
            WaterStressRecord.village_id == village.id
        ).first()

        if existing:
            existing.wsi_score = wsi_data["score"]
            existing.severity = wsi_data["severity"]
            existing.rainfall_component = wsi_data["components"]["rainfall"]
            existing.groundwater_component = wsi_data["components"]["groundwater"]
        else:
            rec = WaterStressRecord(
                village_id=village.id,
                date=datetime.now(),
                wsi_score=wsi_data["score"],
                severity=wsi_data["severity"],
                rainfall_component=wsi_data["components"]["rainfall"],
                groundwater_component=wsi_data["components"]["groundwater"],
            )
            db.add(rec)
        count += 1

    db.commit()
    print(f"  ✅ Recalculated WSI for {count} villages")


def main():
    print("\n🚀 JalMitra Data Importer")
    print("=" * 40)

    # Create tables if not exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("\n📍 Importing villages...")
        n_villages = import_villages(db)

        if n_villages == 0:
            print("  ❌ No villages imported — check villages.csv")
            return

        print("\n🌧️  Importing rainfall data...")
        import_rainfall(db)

        print("\n💧 Importing groundwater data...")
        import_groundwater(db)

        print("\n🚛 Importing tankers...")
        import_tankers(db)

        print("\n🧮 Recalculating Water Stress Index...")
        recalculate_wsi(db)

        print("\n" + "=" * 40)
        print("✅ Import complete! Restart the backend server to see live data.")
        print("   uvicorn main:app --reload --port 8000")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
