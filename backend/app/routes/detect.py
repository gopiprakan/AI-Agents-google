import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.app.database import get_db, Junction
from backend.app.telemetry import trigger_emergency_priority
# Import YOLO detector
from ai_model.yolo_detector import detector

router = APIRouter(prefix="/detect", tags=["AI Image Processing"])

class BBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    confidence: float
    class_name: str

class DetectionResponse(BaseModel):
    camera_id: str
    junction_id: str
    lane: str
    vehicle_count: int
    congestion_percentage: int
    detections: List[BBox]
    ambulance_detected: bool
    priority_mode_triggered: bool

@router.post("", response_model=DetectionResponse)
async def process_frame(
    camera_id: str = Form(...),
    junction_id: str = Form(...),
    lane: str = Form(...), # NORTH, SOUTH, EAST, WEST
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads a live frame to be scanned by YOLOv8 for vehicle distribution and emergency checks."""
    try:
        # Validate junction
        junction = db.query(Junction).filter_by(id=junction_id).first()
        if not junction:
            raise HTTPException(status_code=404, detail="Target junction not found")
            
        # Read file image data bytes
        image_bytes = await file.read()
        
        # Run YOLO Inference (falls back to mock if torch/ultralytics are missing)
        detections = detector.detect_objects(image_bytes)
        
        # Count classifications
        vehicle_classes = ['car', 'bus', 'bike', 'truck', 'auto', 'ambulance']
        box_responses = []
        amb_detected = False
        vehicle_count = 0
        
        for d in detections:
            cname = d["class_name"].lower()
            if cname in vehicle_classes:
                vehicle_count += 1
                if cname == 'ambulance':
                    amb_detected = True
                    
            box_responses.append(BBox(
                x_min=d["bbox"][0],
                y_min=d["bbox"][1],
                x_max=d["bbox"][2],
                y_max=d["bbox"][3],
                confidence=d["confidence"],
                class_name=d["class_name"]
            ))
            
        # Congestion math
        # Simple density percentage based on vehicle density relative to lane capacity
        capacity = 25.0
        congestion_pct = min(100, int((vehicle_count / capacity) * 100))
        
        priority_triggered = False
        if amb_detected:
            # Trigger Emergency override on the junction lane
            # Use background telemetry trigger logic
            trigger_res = trigger_emergency_priority(
                ambulance_id="AMB-LIVE-CAM",
                junction_id=junction_id,
                lane=lane,
                duration_seconds=20 # green light lock for 20s
            )
            if trigger_res["status"] == "success":
                priority_triggered = True
                
        return DetectionResponse(
            camera_id=camera_id,
            junction_id=junction_id,
            lane=lane,
            vehicle_count=vehicle_count,
            congestion_percentage=congestion_pct,
            detections=box_responses,
            ambulance_detected=amb_detected,
            priority_mode_triggered=priority_triggered
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI frame analysis failed: {str(e)}")
