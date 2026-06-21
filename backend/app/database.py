import datetime
import uuid
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from backend.app.config import settings

# Setup database engine
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Helper function to generate UUID strings
def generate_uuid():
    return str(uuid.uuid4())

# User Model
class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # ADMIN, TRAFFIC_OFFICER, OPERATOR, GUEST
    full_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

# Junction Model
class Junction(Base):
    __tablename__ = "junctions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    state = Column(String(20), nullable=False, default="RED")  # RED, YELLOW, GREEN, EMERGENCY_GREEN
    cycle_duration = Column(Integer, nullable=False, default=120)
    current_green_lane = Column(String(10), default="NORTH")
    adaptive_mode = Column(Boolean, default=True)
    last_priority_override_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, MAINTENANCE, OFFLINE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    detections = relationship("DetectionLog", back_populates="junction", cascade="all, delete-orphan")
    alerts = relationship("SystemAlert", back_populates="junction", cascade="all, delete-orphan")
    priority_logs = relationship("AmbulancePriorityLog", back_populates="junction", cascade="all, delete-orphan")

# DetectionLog Model
class DetectionLog(Base):
    __tablename__ = "detection_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    junction_id = Column(String(36), ForeignKey("junctions.id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(String(50), nullable=False)
    lane = Column(String(10), nullable=False)  # NORTH, SOUTH, EAST, WEST
    car_count = Column(Integer, default=0)
    bus_count = Column(Integer, default=0)
    bike_count = Column(Integer, default=0)
    truck_count = Column(Integer, default=0)
    auto_count = Column(Integer, default=0)
    ambulance_count = Column(Integer, default=0)
    congestion_percentage = Column(Integer, default=0)
    density_level = Column(String(10), nullable=False)  # LOW, MEDIUM, HIGH
    logged_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    junction = relationship("Junction", back_populates="detections")

# AmbulancePriorityLog Model
class AmbulancePriorityLog(Base):
    __tablename__ = "ambulance_priority_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    ambulance_id = Column(String(50), nullable=False)
    junction_id = Column(String(36), ForeignKey("junctions.id", ondelete="CASCADE"), nullable=False)
    lane = Column(String(10), nullable=False)
    override_status = Column(String(20), nullable=False)  # TRIGGERED, CLEARED, FAILED
    triggered_at = Column(DateTime, default=datetime.datetime.utcnow)
    cleared_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    junction = relationship("Junction", back_populates="priority_logs")

# SystemAlert Model
class SystemAlert(Base):
    __tablename__ = "system_alerts"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_type = Column(String(50), nullable=False)  # AMBULANCE_DETECTED, HEAVY_CONGESTION, ACCIDENT_DETECTED, etc.
    message = Column(Text, nullable=False)
    severity = Column(String(10), nullable=False)  # INFO, WARNING, CRITICAL
    junction_id = Column(String(36), ForeignKey("junctions.id", ondelete="CASCADE"), nullable=False)
    lane = Column(String(10), nullable=True)
    status = Column(String(20), default="UNRESOLVED")  # UNRESOLVED, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    junction = relationship("Junction", back_populates="alerts")

# Get DB dependency session helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database Seeding Utility
def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seeding database
    db = SessionLocal()
    try:
        # Check if junctions are already seeded
        if db.query(Junction).count() == 0:
            print("DB Initialized: Seeding initial junction nodes...")
            j1 = Junction(
                id="c1a2e3b4-1234-5678-90ab-cdef11112222",
                name="Junction Alpha (North Grid)",
                location_lat=12.9715987,
                location_lng=77.5945627,
                state="GREEN",
                cycle_duration=90,
                current_green_lane="NORTH",
                adaptive_mode=True,
                status="ACTIVE"
            )
            j2 = Junction(
                id="c1a2e3b4-1234-5678-90ab-cdef11113333",
                name="Junction Beta (Commercial St)",
                location_lat=12.9815987,
                location_lng=77.6045627,
                state="RED",
                cycle_duration=120,
                current_green_lane="EAST",
                adaptive_mode=True,
                status="ACTIVE"
            )
            j3 = Junction(
                id="c1a2e3b4-1234-5678-90ab-cdef11114444",
                name="Junction Gamma (Ring Road)",
                location_lat=12.9515987,
                location_lng=77.5845627,
                state="RED",
                cycle_duration=120,
                current_green_lane="SOUTH",
                adaptive_mode=True,
                status="ACTIVE"
            )
            j4 = Junction(
                id="c1a2e3b4-1234-5678-90ab-cdef11115555",
                name="Junction Delta (Tech Park)",
                location_lat=12.9915987,
                location_lng=77.6145627,
                state="YELLOW",
                cycle_duration=90,
                current_green_lane="WEST",
                adaptive_mode=True,
                status="ACTIVE"
            )
            db.add_all([j1, j2, j3, j4])
            db.commit()

        # Seed initial admin user if not present
        if db.query(User).count() == 0:
            print("DB Initialized: Seeding default user accounts...")
            # Prehashed 'password123'
            # $2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6
            admin = User(
                id="a1b2c3d4-5678-9012-3456-7890abcdef11",
                username="admin",
                email="admin@iscts.gov",
                password_hash="$2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6",
                role="ADMIN",
                full_name="Super Administrator"
            )
            officer = User(
                id="a1b2c3d4-5678-9012-3456-7890abcdef22",
                username="officer_smith",
                email="smith@iscts.gov",
                password_hash="$2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6",
                role="TRAFFIC_OFFICER",
                full_name="Officer John Smith"
            )
            db.add_all([admin, officer])
            db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
