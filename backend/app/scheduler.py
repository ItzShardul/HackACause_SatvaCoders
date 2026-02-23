"""
Background Scheduler — Automatically refreshes weather data and recalculates WSI.
Runs silently in the background.

Schedule:
  Every 1 hour  → Fetch live rainfall from Open-Meteo + WeatherAPI
  Every 6 hours → Recalculate WSI for all villages from live data
  Every 7 days  → Fetch NASA POWER historical baselines (slow API)
  On startup    → Full initial data load
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging

from app.database import SessionLocal
from app.models import Village, WaterStressRecord, RainfallData
from app.ml.wsi_calculator import WaterStressCalculator
from app.services.weather_aggregator import get_wsi_inputs_for_all_districts, get_live_rainfall_all_districts
from app.websocket import manager

logger = logging.getLogger("jalmitra.scheduler")
calculator = WaterStressCalculator()
scheduler = AsyncIOScheduler()


async def refresh_live_weather():
    """Hourly: Fetch live rainfall from Open-Meteo + WeatherAPI."""
    try:
        logger.info("⏰ Scheduler: Fetching live weather data...")
        data = await get_live_rainfall_all_districts()
        logger.info(f"✅ Weather refreshed for {data.get('total_districts', 0)} districts")

        # Broadcast to dashboard via WebSocket
        await manager.broadcast({
            "type": "weather_refreshed",
            "data": {
                "timestamp": datetime.now().isoformat(),
                "districts_updated": data.get("total_districts", 0),
                "apis_used": data.get("apis_used", []),
            }
        })
    except Exception as e:
        logger.error(f"❌ Weather refresh failed: {e}")


async def recalculate_all_wsi():
    """Every 6 hours: Pull live weather inputs and update WSI for all villages."""
    db = SessionLocal()
    try:
        logger.info("⏰ Scheduler: Recalculating WSI from live weather data...")

        wsi_inputs = await get_wsi_inputs_for_all_districts()
        villages = db.query(Village).all()

        updated = 0
        escalated = []

        for village in villages:
            try:
                # Use database-driven WSI calculation
                new_wsi = calculator.calculate_wsi(db, village)

                # Check if severity escalated
                existing = db.query(WaterStressRecord).filter(
                    WaterStressRecord.village_id == village.id
                ).first()

                if existing:
                    old_severity = existing.severity
                    new_severity = new_wsi["severity"]

                    existing.wsi_score = new_wsi["wsi_score"]
                    existing.severity = new_severity

                    if old_severity != new_severity:
                        escalated.append({
                            "village": village.name,
                            "district": village.district,
                            "from": old_severity,
                            "to": new_severity,
                            "wsi": new_wsi["wsi_score"],
                        })
                updated += 1
            except Exception:
                pass

        db.commit()
        logger.info(f"✅ WSI updated for {updated} villages, {len(escalated)} escalations")

        # Broadcast escalations immediately via WebSocket
        if escalated:
            for alert in escalated:
                await manager.broadcast({
                    "type": "severity_escalated",
                    "data": alert,
                })

        # Broadcast general update
        await manager.broadcast({
            "type": "wsi_updated",
            "data": {
                "timestamp": datetime.now().isoformat(),
                "villages_updated": updated,
                "escalations": len(escalated),
            }
        })

    except Exception as e:
        logger.error(f"❌ WSI recalculation failed: {e}")
        db.rollback()
    finally:
        db.close()


async def initial_data_load():
    """Runs once on startup — loads initial weather data."""
    logger.info("🚀 Initial weather data load...")
    try:
        await refresh_live_weather()
        logger.info("✅ Initial data load complete")
    except Exception as e:
        logger.warning(f"⚠️  Initial load partial: {e}")


def start_scheduler():
    """Start the background scheduler. Call this from main.py lifespan."""

    # Hourly weather refresh (Open-Meteo + WeatherAPI)
    scheduler.add_job(
        refresh_live_weather,
        trigger=IntervalTrigger(hours=1),
        id="hourly_weather",
        name="Hourly Weather Refresh",
        replace_existing=True,
    )

    # Every 6 hours — WSI recalculation
    scheduler.add_job(
        recalculate_all_wsi,
        trigger=IntervalTrigger(hours=6),
        id="wsi_refresh",
        name="6-Hour WSI Recalculation",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("✅ JalMitra background scheduler started")
    logger.info("   → Hourly: Live weather refresh (Open-Meteo + WeatherAPI)")
    logger.info("   → Every 6h: WSI recalculation for all villages")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
