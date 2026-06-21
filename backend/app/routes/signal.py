import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db, Junction, AmbulancePriorityLog, SystemAlert
from backend.app.routes.auth import require_role
from backend.app.telemetry import trigger_emergency_priority, active_overrides, manager

router = APIRouter(prefix="/signal", tags=["Signal Control"])

# Pydantic Schemas
class OverrideRequest(BaseModel):
    ambulance_id: str
    junction_id: str
    lane: str # NORTH, SOUTH, EAST, WEST
    duration_seconds: Optional[int] = 20

class OverrideClearRequest(BaseModel):
    junction_id: str

class JunctionUpdate(BaseModel):
    id: str
    adaptive_mode: Optional[bool] = None
    cycle_duration: Optional[int] = None
    state: Optional[str] = None # RED, YELLOW, GREEN, EMERGENCY_GREEN
    current_green_lane: Optional[str] = None
    status: Optional[str] = None # ACTIVE, MAINTENANCE, OFFLINE

class JunctionResponse(BaseModel):
    id: str
    name: str
    location_lat: float
    location_lng: float
    state: str
    cycle_duration: int
    current_green_lane: Optional[str]
    adaptive_mode: bool
    status: str

    class Config:
        from_attributes = True

# Router endpoints
@router.get("/junctions", response_model=List[JunctionResponse])
def get_junctions(db: Session = Depends(get_db)):
    return db.query(Junction).all()

@router.post("/override")
def trigger_override(payload: OverrideRequest, db: Session = Depends(get_db)):
    """API called by cameras/AI when an ambulance is detected."""
    res = trigger_emergency_priority(
        ambulance_id=payload.ambulance_id,
        junction_id=payload.junction_id,
        lane=payload.lane,
        duration_seconds=payload.duration_seconds
    )
    if res["status"] == "error":
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/override/clear")
def clear_override(payload: OverrideClearRequest, db: Session = Depends(get_db)):
    """Clears emergency status manually or after priority exit is detected."""
    jid = payload.junction_id
    if jid not in active_overrides:
        raise HTTPException(status_code=400, detail="No active override on this junction")
        
    override_info = active_overrides[jid]
    junction = db.query(Junction).filter_by(id=jid).first()
    now = datetime.datetime.utcnow()
    
    if junction:
        junction.state = "GREEN"
        junction.adaptive_mode = True
        
        # Update priority log
        priority_log = db.query(AmbulancePriorityLog).filter_by(id=override_info["log_id"]).first()
        if priority_log:
            priority_log.override_status = "CLEARED"
            priority_log.cleared_at = now
            priority_log.duration_seconds = int((now - override_info["triggered_at"]).total_seconds())
            
        # Update alert
        alert = db.query(SystemAlert).filter_by(id=override_info["alert_id"]).first()
        if alert:
            alert.status = "RESOLVED"
            
        db.commit()
        
        # Notify clients
        clear_message = {
            "type": "EMERGENCY_CLEAR",
            "timestamp": now.isoformat(),
            "data": {
                "junction_id": jid,
                "junction_name": junction.name
            }
        }
        import asyncio
        asyncio.create_task(manager.broadcast(clear_message))
        
        del active_overrides[jid]
        return {"status": "success", "message": "Emergency state cleared successfully"}
        
    raise HTTPException(status_code=404, detail="Junction not found")

@router.post("/update", dependencies=[Depends(require_role(["ADMIN", "TRAFFIC_OFFICER"]))])
def update_junction(payload: JunctionUpdate, db: Session = Depends(get_db)):
    junction = db.query(Junction).filter_by(id=payload.id).first()
    if not junction:
        raise HTTPException(status_code=404, detail="Junction not found")
        
    if payload.adaptive_mode is not None:
        junction.adaptive_mode = payload.adaptive_mode
    if payload.cycle_duration is not None:
        junction.cycle_duration = payload.cycle_duration
    if payload.state is not None:
        if payload.state not in ['RED', 'YELLOW', 'GREEN', 'EMERGENCY_GREEN']:
            raise HTTPException(status_code=400, detail="Invalid signal state")
        junction.state = payload.state
    if payload.current_green_lane is not None:
        if payload.current_green_lane not in ['NORTH', 'SOUTH', 'EAST', 'WEST']:
            raise HTTPException(status_code=400, detail="Invalid lane")
        junction.current_green_lane = payload.current_green_lane
    if payload.status is not None:
        if payload.status not in ['ACTIVE', 'MAINTENANCE', 'OFFLINE']:
            raise HTTPException(status_code=400, detail="Invalid operating status")
        junction.status = payload.status
        
    db.commit()
    
    # Broadcast change
    asyncio_msg = {
        "type": "JUNCTION_MANUAL_UPDATE",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "data": {
            "id": junction.id,
            "name": junction.name,
            "state": junction.state,
            "current_green_lane": junction.current_green_lane,
            "adaptive_mode": junction.adaptive_mode,
            "status": junction.status,
            "cycle_duration": junction.cycle_duration
        }
    }
    import asyncio
    asyncio.create_task(manager.broadcast(asyncio_msg))
    
    return {"status": "success", "message": "Junction configurations updated successfully"}
