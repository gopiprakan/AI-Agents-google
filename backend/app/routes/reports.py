import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db, DetectionLog, Junction

router = APIRouter(prefix="/reports", tags=["Reports Export"])

@router.get("/download")
def download_report(
    report_type: str = Query("csv", regex="^(csv|excel|pdf)$"),
    junction_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Exports log databases of vehicle telemetry data as CSV streams or mock binaries."""
    # Filter detections
    query = db.query(DetectionLog)
    if junction_id:
        query = query.filter(DetectionLog.junction_id == junction_id)
        
    records = query.order_by(DetectionLog.logged_at.desc()).limit(100).all()
    
    if report_type == "csv":
        # Create CSV memory buffer
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            "Log ID", "Junction Name", "Camera Feed", "Lane", 
            "Cars", "Buses", "Bikes", "Trucks", "Autos", "Ambulances",
            "Congestion Score (%)", "Density Level", "Timestamp"
        ])
        
        for r in records:
            j_name = r.junction.name if r.junction else "Unknown Junction"
            writer.writerow([
                r.id, j_name, r.camera_id, r.lane,
                r.car_count, r.bus_count, r.bike_count, r.truck_count, r.auto_count, r.ambulance_count,
                r.congestion_percentage, r.density_level, r.logged_at.isoformat()
            ])
            
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=traffic_report_{datetime.datetime.now().strftime('%Y%m%d')}.csv"}
        )
        
    elif report_type == "excel":
        # Return mock Excel file structure
        # (Standard binary byte buffer matching Excel content types)
        mem = io.BytesIO()
        mem.write(b"ISCTS MOCK EXCEL SHEETS TELEMETRY AUDIT LOGS\n")
        for r in records:
            j_name = r.junction.name if r.junction else "Unknown"
            mem.write(f"{r.id},{j_name},{r.lane},{r.car_count},{r.congestion_percentage}\n".encode())
        mem.seek(0)
        return StreamingResponse(
            mem,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=traffic_report.xlsx"}
        )
        
    else: # PDF
        # Return mock PDF representation
        mem = io.BytesIO()
        mem.write(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n4 0 obj<</Length 62>>stream\nBT /F1 24 Tf 100 700 Td (ISCTS SMART CITY TRAFFIC AUDIT REPORT) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000186 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n299\n%%EOF")
        mem.seek(0)
        return StreamingResponse(
            mem,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=traffic_report.pdf"}
        )

# Simple date time module local imports
import datetime
