import asyncio
import datetime
import random
import json
from typing import Dict, List, Set
from fastapi import WebSocket
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, Junction, DetectionLog, SystemAlert, AmbulancePriorityLog

class ConnectionManager:
    """Manages WebSocket connections for real-time telemetry updates."""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.add(connection)
        
        for conn in dead_connections:
            self.active_connections.remove(conn)

manager = ConnectionManager()

# Global tracking for emergency overrides
# Key: junction_id, Value: dict containing override info
active_overrides: Dict[str, dict] = {}

def get_current_lanes():
    return ['NORTH', 'SOUTH', 'EAST', 'WEST']

def generate_mock_counts(lane: str, is_congested: bool = False):
    """Generate realistic vehicle counts based on congestion status."""
    if is_congested:
        car = random.randint(25, 40)
        bus = random.randint(4, 8)
        bike = random.randint(15, 30)
        truck = random.randint(3, 7)
        auto = random.randint(10, 18)
        amb = 0
        congestion = random.randint(75, 95)
        density = "HIGH"
    else:
        # Standard random distribution
        car = random.randint(5, 20)
        bus = random.randint(0, 3)
        bike = random.randint(4, 15)
        truck = random.randint(0, 2)
        auto = random.randint(2, 8)
        amb = 0
        congestion = random.randint(15, 60)
        density = "LOW" if congestion < 40 else "MEDIUM"
        
    return {
        "car": car,
        "bus": bus,
        "bike": bike,
        "truck": truck,
        "auto": auto,
        "ambulance": amb,
        "congestion": congestion,
        "density": density
    }

async def traffic_simulation_loop():
    """Background loop that simulates real-time traffic updates and broadcasts telemetry."""
    print("Traffic Simulation engine started...")
    
    # Simple lane progression rules for normal junctions: North -> East -> South -> West
    lane_progression = ['NORTH', 'EAST', 'SOUTH', 'WEST']
    
    while True:
        try:
            await asyncio.sleep(3.0)  # Telemetry update frequency
            
            db: Session = SessionLocal()
            junctions = db.query(Junction).all()
            
            telemetry_data = []
            
            for j in junctions:
                jid = j.id
                now = datetime.datetime.utcnow()
                
                # Check for active priority emergency overrides on this junction
                is_override_active = jid in active_overrides
                
                # Check timers for current overrides
                if is_override_active:
                    override_info = active_overrides[jid]
                    elapsed = (now - override_info["triggered_at"]).total_seconds()
                    
                    if elapsed >= override_info["duration_seconds"]:
                        # Reset override status
                        print(f"Priority override expired for Ambulance {override_info['ambulance_id']} at junction {j.name}")
                        
                        # Update DB logs
                        priority_log = db.query(AmbulancePriorityLog).filter_by(id=override_info["log_id"]).first()
                        if priority_log:
                            priority_log.override_status = "CLEARED"
                            priority_log.cleared_at = now
                            priority_log.duration_seconds = int(elapsed)
                            
                        alert = db.query(SystemAlert).filter_by(id=override_info["alert_id"]).first()
                        if alert:
                            alert.status = "RESOLVED"
                            
                        # Revert junction status
                        j.state = "GREEN"
                        j.adaptive_mode = True
                        
                        # Remove from override tracker
                        del active_overrides[jid]
                        is_override_active = False
                        db.commit()
                
                # Dynamic green light calculation for normal operation
                if not is_override_active:
                    # Adaptive Mode calculations: calculate density and transition lane
                    # Simulating simple timing decrement
                    j.cycle_duration = max(5, j.cycle_duration - 3)
                    
                    if j.cycle_duration <= 5:
                        # Transition to Yellow, then to next green lane
                        if j.state == "GREEN":
                            j.state = "YELLOW"
                            j.cycle_duration = 5  # Yellow time
                        else:
                            # State was Yellow or Red, switch to next lane green
                            j.state = "GREEN"
                            current_idx = lane_progression.index(j.current_green_lane)
                            next_idx = (current_idx + 1) % len(lane_progression)
                            j.current_green_lane = lane_progression[next_idx]
                            
                            # Adaptive cycle based on lane density simulation
                            # A busier lane gets more green duration (40s - 90s)
                            j.cycle_duration = random.randint(30, 75)
                            
                        db.commit()
                
                # Generate new lane metrics
                lane_metrics = {}
                overall_congestion = 0
                
                for lane in lane_progression:
                    # Randomly make one lane highly congested occasionally
                    is_congested = (lane == "EAST" and j.name.endswith("Alpha)")) or (random.random() < 0.15)
                    counts = generate_mock_counts(lane, is_congested)
                    
                    # Override if ambulance is active in this lane
                    if is_override_active and active_overrides[jid]["lane"] == lane:
                        counts["ambulance"] = 1
                        counts["congestion"] = max(80, counts["congestion"])
                        counts["density"] = "HIGH"
                    
                    overall_congestion += counts["congestion"]
                    
                    # Store log record in DB
                    log = DetectionLog(
                        junction_id=jid,
                        camera_id=f"CAM_{j.name.split()[1].upper()}_{lane}",
                        lane=lane,
                        car_count=counts["car"],
                        bus_count=counts["bus"],
                        bike_count=counts["bike"],
                        truck_count=counts["truck"],
                        auto_count=counts["auto"],
                        ambulance_count=counts["ambulance"],
                        congestion_percentage=counts["congestion"],
                        density_level=counts["density"]
                    )
                    db.add(log)
                    
                    lane_metrics[lane] = counts
                
                # Average congestion
                overall_congestion = int(overall_congestion / 4)
                
                # Trigger a heavy traffic congestion alert if average density is High
                if overall_congestion > 75 and random.random() < 0.1:
                    alert_exists = db.query(SystemAlert).filter_by(
                        junction_id=jid,
                        alert_type="HEAVY_CONGESTION",
                        status="UNRESOLVED"
                    ).first()
                    
                    if not alert_exists:
                        congestion_alert = SystemAlert(
                            alert_type="HEAVY_CONGESTION",
                            message=f"Critical traffic density of {overall_congestion}% registered at {j.name}.",
                            severity="WARNING",
                            junction_id=jid,
                            status="UNRESOLVED"
                        )
                        db.add(congestion_alert)
                
                db.commit()
                
                telemetry_data.append({
                    "id": j.id,
                    "name": j.name,
                    "lat": j.location_lat,
                    "lng": j.location_lng,
                    "state": j.state,
                    "cycle_duration": j.cycle_duration,
                    "current_green_lane": j.current_green_lane,
                    "adaptive_mode": j.adaptive_mode,
                    "status": j.status,
                    "congestion_score": overall_congestion,
                    "lane_metrics": lane_metrics
                })
            
            # Broadcast metrics to connected web frontends
            await manager.broadcast({
                "type": "TELEMETRY_UPDATE",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "data": telemetry_data
            })
            
            db.close()
            
        except Exception as e:
            print(f"Exception error in traffic simulation thread: {e}")
            if 'db' in locals():
                db.close()
            await asyncio.sleep(5.0)

def trigger_emergency_priority(ambulance_id: str, junction_id: str, lane: str, duration_seconds: int = 15) -> dict:
    """API gateway wrapper to trigger emergency green lights."""
    db: Session = SessionLocal()
    try:
        junction = db.query(Junction).filter_by(id=junction_id).first()
        if not junction:
            return {"status": "error", "message": "Junction not found"}
            
        now = datetime.datetime.utcnow()
        
        # Insert alert record
        alert = SystemAlert(
            alert_type="AMBULANCE_DETECTED",
            message=f"Emergency Priority Mode active: Ambulance {ambulance_id} detected approaching on {lane} lane at {junction.name}.",
            severity="CRITICAL",
            junction_id=junction_id,
            lane=lane,
            status="UNRESOLVED"
        )
        db.add(alert)
        db.flush() # populated alert ID
        
        # Insert priority logs
        priority_log = AmbulancePriorityLog(
            ambulance_id=ambulance_id,
            junction_id=junction_id,
            lane=lane,
            override_status="TRIGGERED",
            triggered_at=now
        )
        db.add(priority_log)
        db.flush() # populated log ID
        
        # Force traffic junction status
        junction.state = "EMERGENCY_GREEN"
        junction.current_green_lane = lane
        junction.adaptive_mode = False
        junction.last_priority_override_at = now
        db.commit()
        
        # Register in globally active track maps
        active_overrides[junction_id] = {
            "ambulance_id": ambulance_id,
            "lane": lane,
            "duration_seconds": duration_seconds,
            "triggered_at": now,
            "alert_id": alert.id,
            "log_id": priority_log.id
        }
        
        # Create broadcast packet immediately
        override_message = {
            "type": "EMERGENCY_TRIGGER",
            "timestamp": now.isoformat(),
            "data": {
                "ambulance_id": ambulance_id,
                "junction_id": junction_id,
                "junction_name": junction.name,
                "lane": lane,
                "duration_seconds": duration_seconds
            }
        }
        
        # Broadcast asynchronously
        asyncio.create_task(manager.broadcast(override_message))
        
        return {
            "status": "success",
            "message": f"Emergency Priority activated for lane {lane} at {junction.name}",
            "log_id": priority_log.id
        }
        
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
