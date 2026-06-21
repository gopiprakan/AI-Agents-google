import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.routes import auth, signal, analytics, reports, detect
from backend.app.telemetry import manager, traffic_simulation_loop

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(signal.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(detect.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "ISCTS Traffic Solutions API",
        "docs_url": "/docs"
    }

# WebSockets Endpoint
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection alive and listen for client messages if any
            data = await websocket.receive_text()
            # Handle incoming signals from client dashboard if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket Exception error: {e}")
        manager.disconnect(websocket)

# Startup Events
@app.on_event("startup")
def startup_event():
    # Initialize DB (Tables and default seeds)
    init_db()
    
    # Run the background traffic simulation thread
    loop = asyncio.get_event_loop()
    loop.create_task(traffic_simulation_loop())
    print("ISCTS Systems fully online and simulation loop scheduled.")

# Single-Container Cloud Hosting support
# Serves the compiled React frontend static assets directly from the API container
import os
from fastapi.staticfiles import StaticFiles

# Resolve path to compiled frontend
frontend_dist_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist"))
if os.path.exists(frontend_dist_dir):
    app.mount("/", StaticFiles(directory=frontend_dist_dir, html=True), name="frontend")
    print(f"Cloud Deployment: Serving static frontend client from {frontend_dist_dir}")
else:
    print("Local Dev: Frontend static distribution folder not compiled yet. Serving API routes only.")

