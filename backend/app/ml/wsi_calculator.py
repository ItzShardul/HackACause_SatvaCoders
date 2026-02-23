"""
Water Stress Index Calculator for JalMitra.
Multi-factor WSI using rainfall deviation, groundwater decline,
population density, and historical demand.
"""
import math
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Village, RainfallData, GroundwaterData, WaterStressRecord, Trip


class WaterStressCalculator:
    """Calculate village-level Water Stress Index (WSI)."""

    WEIGHTS = {
        "rainfall": 0.35,
        "groundwater": 0.30,
        "population": 0.15,
        "demand": 0.20,
    }

    SEVERITY_THRESHOLDS = {
        "normal": (0, 20),
        "watch": (20, 40),
        "warning": (40, 60),
        "critical": (60, 80),
        "emergency": (80, 100),
    }

    @staticmethod
    def get_severity(wsi_score: float) -> str:
        if wsi_score < 20:
            return "normal"
        elif wsi_score < 40:
            return "watch"
        elif wsi_score < 60:
            return "warning"
        elif wsi_score < 80:
            return "critical"
        return "emergency"

    @staticmethod
    def get_severity_color(severity: str) -> str:
        colors = {
            "normal": "#10B981",
            "watch": "#F59E0B",
            "warning": "#F97316",
            "critical": "#EF4444",
            "emergency": "#991B1B",
        }
        return colors.get(severity, "#6B7280")

    def calculate_rainfall_component(self, db: Session, village_id: int, months: int = 6) -> float:
        """Calculate rainfall deviation score (0-100). Higher = more stress."""
        cutoff = datetime.utcnow() - timedelta(days=months * 30)
        records = db.query(RainfallData).filter(
            RainfallData.village_id == village_id,
            RainfallData.date >= cutoff
        ).all()

        if not records:
            return 50.0  # unknown = moderate stress

        total_actual = sum(r.rainfall_mm for r in records)
        total_normal = sum(r.normal_rainfall_mm for r in records if r.normal_rainfall_mm)

        if total_normal == 0:
            return 50.0

        deviation_pct = ((total_normal - total_actual) / total_normal) * 100
        # Clamp to 0-100: 0% deficit = 0 stress, 60%+ deficit = 100 stress
        score = min(100, max(0, deviation_pct * (100 / 60)))
        return round(score, 1)

    def calculate_groundwater_component(self, db: Session, village_id: int, months: int = 12) -> float:
        """Calculate groundwater decline score (0-100). Higher = more stress."""
        records = db.query(GroundwaterData).filter(
            GroundwaterData.village_id == village_id
        ).order_by(GroundwaterData.date.desc()).limit(months).all()

        if len(records) < 2:
            return 50.0

        recent = records[0].level_meters
        oldest = records[-1].level_meters
        # Positive change = water level dropped (deeper)
        decline = recent - oldest

        # 0m decline = 0 stress, 10m+ decline = 100 stress
        score = min(100, max(0, (decline / 10) * 100))
        return round(score, 1)

    def calculate_population_component(self, village: Village) -> float:
        """Calculate population pressure score (0-100)."""
        # Normalize: 0-50000 population = 0-100 stress
        score = min(100, (village.population / 50000) * 100)
        return round(score, 1)

    def calculate_demand_component(self, db: Session, village_id: int, days: int = 90) -> float:
        """Calculate historical demand score based on tanker trip frequency (0-100)."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        trip_count = db.query(func.count(Trip.id)).filter(
            Trip.village_id == village_id,
            Trip.created_at >= cutoff
        ).scalar() or 0

        # 0 trips = 0 stress, 10+ trips in 90 days = 100 stress
        score = min(100, (trip_count / 10) * 100)
        return round(score, 1)

    def calculate_wsi(self, db: Session, village: Village) -> Dict:
        """Calculate comprehensive Water Stress Index for a village."""
        rainfall_score = self.calculate_rainfall_component(db, village.id)
        groundwater_score = self.calculate_groundwater_component(db, village.id)
        population_score = self.calculate_population_component(village)
        demand_score = self.calculate_demand_component(db, village.id)

        wsi = (
            rainfall_score * self.WEIGHTS["rainfall"] +
            groundwater_score * self.WEIGHTS["groundwater"] +
            population_score * self.WEIGHTS["population"] +
            demand_score * self.WEIGHTS["demand"]
        )
        wsi = round(min(100, max(0, wsi)), 1)
        severity = self.get_severity(wsi)

        return {
            "village_id": village.id,
            "village_name": village.name,
            "wsi_score": wsi,
            "severity": severity,
            "severity_color": self.get_severity_color(severity),
            "components": {
                "rainfall": {"score": rainfall_score, "weight": self.WEIGHTS["rainfall"]},
                "groundwater": {"score": groundwater_score, "weight": self.WEIGHTS["groundwater"]},
                "population": {"score": population_score, "weight": self.WEIGHTS["population"]},
                "demand": {"score": demand_score, "weight": self.WEIGHTS["demand"]},
            },
        }

    def simulate_wsi(self, db: Session, village: Village, rainfall_change_pct: float) -> Dict:
        """
        What-If simulation: recalculate WSI if rainfall changes by given percentage.
        rainfall_change_pct: negative = less rain (drought), positive = more rain
        """
        base = self.calculate_wsi(db, village)
        base_rainfall = base["components"]["rainfall"]["score"]

        # Adjust rainfall component based on simulation
        simulated_rainfall = min(100, max(0, base_rainfall - rainfall_change_pct))

        groundwater_score = base["components"]["groundwater"]["score"]
        population_score = base["components"]["population"]["score"]
        demand_score = base["components"]["demand"]["score"]

        simulated_wsi = (
            simulated_rainfall * self.WEIGHTS["rainfall"] +
            groundwater_score * self.WEIGHTS["groundwater"] +
            population_score * self.WEIGHTS["population"] +
            demand_score * self.WEIGHTS["demand"]
        )
        simulated_wsi = round(min(100, max(0, simulated_wsi)), 1)
        severity = self.get_severity(simulated_wsi)

        return {
            "village_id": village.id,
            "village_name": village.name,
            "original_wsi": base["wsi_score"],
            "simulated_wsi": simulated_wsi,
            "original_severity": base["severity"],
            "simulated_severity": severity,
            "severity_color": self.get_severity_color(severity),
            "rainfall_change_pct": rainfall_change_pct,
        }


wsi_calculator = WaterStressCalculator()
