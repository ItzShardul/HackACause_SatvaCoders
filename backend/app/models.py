from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    COLLECTOR = "collector"
    GRAM_PANCHAYAT = "gram_panchayat"
    DRIVER = "driver"


class Severity(str, enum.Enum):
    NORMAL = "normal"
    WATCH = "watch"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class TripStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class TankerStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    MAINTENANCE = "maintenance"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"


# ─── Users ───
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.GRAM_PANCHAYAT)
    phone = Column(String(15))
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    district = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    village = relationship("Village", back_populates="users")


# ─── Villages ───
class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    taluka = Column(String(100), nullable=False)
    state = Column(String(50), default="Maharashtra")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, nullable=False)
    households = Column(Integer)
    primary_water_source = Column(String(50))
    groundwater_level = Column(Float)  # meters below surface
    last_rainfall_mm = Column(Float)
    avg_annual_rainfall_mm = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="village")
    wsi_records = relationship("WaterStressRecord", back_populates="village")
    trips = relationship("Trip", back_populates="village")
    requests = relationship("WaterRequest", back_populates="village")
    predictions = relationship("Prediction", back_populates="village")
    rainfall_data = relationship("RainfallData", back_populates="village")
    groundwater_data = relationship("GroundwaterData", back_populates="village")


# ─── Water Stress Index Records ───
class WaterStressRecord(Base):
    __tablename__ = "water_stress_records"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    wsi_score = Column(Float, nullable=False)  # 0-100
    severity = Column(String(20), nullable=False)
    rainfall_deviation = Column(Float)  # percentage
    groundwater_decline = Column(Float)  # percentage
    demand_factor = Column(Float)
    components = Column(JSON)  # detailed breakdown
    created_at = Column(DateTime, default=datetime.utcnow)

    village = relationship("Village", back_populates="wsi_records")


# ─── Tankers ───
class Tanker(Base):
    __tablename__ = "tankers"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(20), unique=True, nullable=False)
    capacity_liters = Column(Integer, nullable=False)
    driver_name = Column(String(100))
    driver_phone = Column(String(15))
    status = Column(String(20), default=TankerStatus.AVAILABLE)
    current_latitude = Column(Float)
    current_longitude = Column(Float)
    depot_latitude = Column(Float)
    depot_longitude = Column(Float)
    district = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("Trip", back_populates="tanker")


# ─── Trips ───
class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    tanker_id = Column(Integer, ForeignKey("tankers.id"), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    status = Column(String(20), default=TripStatus.ASSIGNED)
    quantity_liters = Column(Integer)
    priority_score = Column(Float)
    scheduled_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    route_distance_km = Column(Float)
    route_duration_min = Column(Float)
    delivery_proof_url = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    tanker = relationship("Tanker", back_populates="trips")
    village = relationship("Village", back_populates="trips")


# ─── Water Requests ───
class WaterRequest(Base):
    __tablename__ = "water_requests"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    requested_by = Column(String(100))
    phone = Column(String(15))
    urgency = Column(String(20), default="medium")  # low, medium, high, critical
    quantity_needed_liters = Column(Integer)
    reason = Column(Text)
    status = Column(String(20), default=RequestStatus.PENDING)
    assigned_trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)

    village = relationship("Village", back_populates="requests")


# ─── Predictions ───
class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    prediction_date = Column(DateTime, nullable=False)
    target_date = Column(DateTime, nullable=False)
    predicted_wsi = Column(Float)
    predicted_severity = Column(String(20))
    predicted_demand_liters = Column(Integer)
    predicted_tanker_trips = Column(Integer)
    confidence = Column(Float)  # 0-1
    model_version = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)

    village = relationship("Village", back_populates="predictions")


# ─── Rainfall Data (Time Series) ───
class RainfallData(Base):
    __tablename__ = "rainfall_data"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    normal_rainfall_mm = Column(Float)  # expected for this period
    deviation_percent = Column(Float)

    village = relationship("Village", back_populates="rainfall_data")


# ─── Groundwater Data (Time Series) ───
class GroundwaterData(Base):
    __tablename__ = "groundwater_data"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    level_meters = Column(Float, nullable=False)  # below ground surface
    change_from_previous = Column(Float)  # meters

    village = relationship("Village", back_populates="groundwater_data")


# ─── Grievances ───
class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    submitted_by = Column(String(100))
    phone = Column(String(15))
    category = Column(String(50))  # delay, quality, quantity, other
    description = Column(Text, nullable=False)
    status = Column(String(20), default="open")  # open, in_progress, resolved
    resolution = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
