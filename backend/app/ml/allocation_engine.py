"""
Priority-based tanker allocation engine.
Score = population × 0.3 + severity × 0.4 + days_since_last × 0.2 + vulnerable × 0.1
"""
from typing import List, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Village, WaterStressRecord, Trip, Tanker, WaterRequest


class AllocationEngine:
    """Priority-based tanker allocation."""

    WEIGHTS = {
        "severity": 0.40,
        "population": 0.30,
        "days_since_supply": 0.20,
        "pending_requests": 0.10,
    }

    def _severity_score(self, severity: str) -> float:
        mapping = {
            "normal": 10,
            "watch": 30,
            "warning": 55,
            "critical": 80,
            "emergency": 100,
        }
        return mapping.get(severity, 50)

    def _days_since_last_supply(self, db: Session, village_id: int) -> int:
        last_trip = db.query(Trip).filter(
            Trip.village_id == village_id,
            Trip.status == "delivered"
        ).order_by(Trip.completed_at.desc()).first()

        if not last_trip or not last_trip.completed_at:
            return 30  # assume 30 days if never supplied
        return (datetime.utcnow() - last_trip.completed_at).days

    def _pending_request_count(self, db: Session, village_id: int) -> int:
        return db.query(func.count(WaterRequest.id)).filter(
            WaterRequest.village_id == village_id,
            WaterRequest.status.in_(["pending", "approved"])
        ).scalar() or 0

    def calculate_priority(self, db: Session, village: Village, wsi_record: WaterStressRecord) -> Dict:
        """Calculate priority score for a village."""
        severity_score = self._severity_score(wsi_record.severity)
        pop_score = min(100, (village.population / 50000) * 100)
        days = self._days_since_last_supply(db, village.id)
        days_score = min(100, (days / 30) * 100)
        requests = self._pending_request_count(db, village.id)
        request_score = min(100, requests * 25)

        priority = (
            severity_score * self.WEIGHTS["severity"] +
            pop_score * self.WEIGHTS["population"] +
            days_score * self.WEIGHTS["days_since_supply"] +
            request_score * self.WEIGHTS["pending_requests"]
        )
        priority = round(min(100, max(0, priority)), 1)

        return {
            "village_id": village.id,
            "village_name": village.name,
            "district": village.district,
            "taluka": village.taluka,
            "priority_score": priority,
            "wsi_score": wsi_record.wsi_score,
            "severity": wsi_record.severity,
            "population": village.population,
            "days_since_last_supply": days,
            "pending_requests": requests,
            "recommended_liters": self._recommend_quantity(village, wsi_record),
            "components": {
                "severity": {"score": severity_score, "weight": self.WEIGHTS["severity"]},
                "population": {"score": pop_score, "weight": self.WEIGHTS["population"]},
                "days_since_supply": {"score": days_score, "weight": self.WEIGHTS["days_since_supply"]},
                "pending_requests": {"score": request_score, "weight": self.WEIGHTS["pending_requests"]},
            },
        }

    def _recommend_quantity(self, village: Village, wsi: WaterStressRecord) -> int:
        """Recommend water quantity based on population and severity."""
        base = village.population * 20  # 20 liters per person per day
        multiplier = {
            "normal": 0.5,
            "watch": 0.7,
            "warning": 1.0,
            "critical": 1.3,
            "emergency": 1.5,
        }.get(wsi.severity, 1.0)
        return int(base * multiplier)

    def get_prioritized_villages(self, db: Session, limit: int = 20) -> List[Dict]:
        """Get ranked list of villages by priority score."""
        villages = db.query(Village).all()
        results = []

        for village in villages:
            wsi = db.query(WaterStressRecord).filter(
                WaterStressRecord.village_id == village.id
            ).order_by(WaterStressRecord.date.desc()).first()

            if wsi:
                results.append(self.calculate_priority(db, village, wsi))

        results.sort(key=lambda x: x["priority_score"], reverse=True)
        return results[:limit]

    def allocate_tankers(self, db: Session) -> List[Dict]:
        """Auto-allocate available tankers to highest-priority villages."""
        prioritized = self.get_prioritized_villages(db, limit=50)
        available_tankers = db.query(Tanker).filter(
            Tanker.status == "available"
        ).all()

        allocations = []
        for i, village_data in enumerate(prioritized):
            if i >= len(available_tankers):
                break

            tanker = available_tankers[i]
            allocations.append({
                **village_data,
                "assigned_tanker": {
                    "id": tanker.id,
                    "registration": tanker.registration_number,
                    "capacity": tanker.capacity_liters,
                    "driver": tanker.driver_name,
                    "driver_phone": tanker.driver_phone,
                },
            })

        return allocations


allocation_engine = AllocationEngine()
