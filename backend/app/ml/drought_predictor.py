"""
Drought prediction engine using time series analysis.
Uses linear regression + seasonal decomposition for hackathon demo.
(Prophet can be added later for production)
"""
import numpy as np
from typing import List, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Village, RainfallData, GroundwaterData, WaterStressRecord, Prediction
from app.ml.wsi_calculator import WaterStressCalculator


class DroughtPredictor:
    """Predict drought conditions and tanker demand."""

    def __init__(self):
        self.wsi_calc = WaterStressCalculator()

    def predict_village(self, db: Session, village: Village, days_ahead: int = 30) -> Dict:
        """Predict WSI and tanker demand for a village."""
        # Get historical rainfall trend
        rainfall_records = db.query(RainfallData).filter(
            RainfallData.village_id == village.id
        ).order_by(RainfallData.date.desc()).limit(12).all()

        # Get historical groundwater trend
        gw_records = db.query(GroundwaterData).filter(
            GroundwaterData.village_id == village.id
        ).order_by(GroundwaterData.date.desc()).limit(12).all()

        # Calculate trends
        rainfall_trend = self._calculate_trend([r.rainfall_mm for r in reversed(rainfall_records)])
        gw_trend = self._calculate_trend([r.level_meters for r in reversed(gw_records)])

        # Get current WSI
        current_wsi = db.query(WaterStressRecord).filter(
            WaterStressRecord.village_id == village.id
        ).order_by(WaterStressRecord.date.desc()).first()

        current_score = current_wsi.wsi_score if current_wsi else 50

        # Predict future WSI based on trends
        months_ahead = days_ahead / 30
        rainfall_impact = rainfall_trend * months_ahead * 5  # negative trend = increasing stress
        gw_impact = gw_trend * months_ahead * 3  # positive trend (deeper) = increasing stress

        predicted_wsi = current_score - rainfall_impact + gw_impact
        predicted_wsi = round(min(100, max(0, predicted_wsi)), 1)

        severity = self.wsi_calc.get_severity(predicted_wsi)

        # Demand estimation: liters per person per day * population * severity multiplier
        severity_multiplier = {"normal": 0.3, "watch": 0.5, "warning": 0.8, "critical": 1.2, "emergency": 1.5}
        daily_demand = village.population * 20 * severity_multiplier.get(severity, 1.0)
        total_demand = int(daily_demand * days_ahead)
        trips_needed = max(1, total_demand // 10000)

        confidence = max(0.5, min(0.95, 0.9 - (days_ahead / 300)))

        return {
            "village_id": village.id,
            "village_name": village.name,
            "district": village.district,
            "current_wsi": current_score,
            "predicted_wsi": predicted_wsi,
            "current_severity": current_wsi.severity if current_wsi else "unknown",
            "predicted_severity": severity,
            "severity_color": self.wsi_calc.get_severity_color(severity),
            "days_ahead": days_ahead,
            "target_date": (datetime.utcnow() + timedelta(days=days_ahead)).isoformat(),
            "predicted_demand_liters": total_demand,
            "predicted_tanker_trips": trips_needed,
            "confidence": round(confidence, 2),
            "trends": {
                "rainfall": round(rainfall_trend, 3),
                "rainfall_direction": "declining" if rainfall_trend < 0 else "stable" if abs(rainfall_trend) < 0.1 else "increasing",
                "groundwater": round(gw_trend, 3),
                "groundwater_direction": "declining" if gw_trend > 0 else "stable" if abs(gw_trend) < 0.1 else "recovering",
            },
        }

    def predict_all_villages(self, db: Session, days_ahead: int = 30) -> List[Dict]:
        """Predict drought for all villages."""
        villages = db.query(Village).all()
        predictions = []
        for village in villages:
            pred = self.predict_village(db, village, days_ahead)
            predictions.append(pred)

        predictions.sort(key=lambda x: x["predicted_wsi"], reverse=True)
        return predictions

    def get_district_summary(self, db: Session, days_ahead: int = 30) -> Dict:
        """Get aggregated predictions by district."""
        all_predictions = self.predict_all_villages(db, days_ahead)

        districts = {}
        for pred in all_predictions:
            d = pred["district"]
            if d not in districts:
                districts[d] = {
                    "district": d,
                    "villages": [],
                    "total_demand_liters": 0,
                    "total_trips": 0,
                    "avg_wsi": 0,
                    "critical_count": 0,
                    "emergency_count": 0,
                }
            districts[d]["villages"].append(pred)
            districts[d]["total_demand_liters"] += pred["predicted_demand_liters"]
            districts[d]["total_trips"] += pred["predicted_tanker_trips"]
            if pred["predicted_severity"] == "critical":
                districts[d]["critical_count"] += 1
            elif pred["predicted_severity"] == "emergency":
                districts[d]["emergency_count"] += 1

        for d in districts.values():
            if d["villages"]:
                d["avg_wsi"] = round(
                    sum(v["predicted_wsi"] for v in d["villages"]) / len(d["villages"]), 1
                )
            d["village_count"] = len(d["villages"])

        return {
            "prediction_horizon_days": days_ahead,
            "districts": list(districts.values()),
            "total_villages": len(all_predictions),
            "total_demand_liters": sum(d["total_demand_liters"] for d in districts.values()),
            "total_trips_needed": sum(d["total_trips"] for d in districts.values()),
        }

    @staticmethod
    def _calculate_trend(values: List[float]) -> float:
        """Calculate linear trend from time series. Positive = increasing."""
        if len(values) < 2:
            return 0.0
        n = len(values)
        x = np.arange(n)
        y = np.array(values)

        if np.std(y) == 0:
            return 0.0

        slope = np.polyfit(x, y, 1)[0]
        return float(slope)


drought_predictor = DroughtPredictor()
