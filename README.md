# Integrated Smart City Traffic Solutions (ISCTS)

Integrated Smart City Traffic Solutions (ISCTS) is a production-grade, full-stack municipal telemetry platform designed to regulate traffic flow and clear pathways dynamically for emergency vehicles using real-time AI object detection (YOLOv8) and adaptive scheduling.

---

## 🏗️ Architecture Design & Workflows

### System Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Traffic Officer (Web Console)
    participant WS as WebSocket Channel
    participant Backend as FastAPI Server
    participant AI as YOLO Inference Engine
    participant Camera as RTSP Intersection Feed

    Camera->>AI: Stream frame arrays
    AI->>AI: Scan (YOLOv8 Object Detection)
    alt Ambulance Detected (Confidence > 0.6)
        AI->>Backend: Post frame stats with ambulance alert trigger
        Backend->>Backend: Lock Signal state to EMERGENCY_GREEN
        Backend->>WS: Broadcast EMERGENCY_TRIGGER packet
        WS->>Officer: Show Siren Alarm & flash red layout warning
    else Standard Cycle
        AI->>Backend: Post vehicle counts (Cars, Buses, Bikes)
        Backend->>Backend: Update lane density index (SQL databases)
        Backend->>Backend: Calculate adaptive green timing duration
    end
    Backend->>WS: Broadcast TELEMETRY_UPDATE packet
    WS->>Officer: Render charts, map congestion nodes, & countdown timers

---

## 🛠️ Technology Stack

- **Frontend**: React.js 18, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Python FastAPI, Uvicorn, SQLAlchemy, WebSockets
- **AI Engine**: YOLOv8 (Ultralytics), OpenCV, PyTorch, NumPy
- **Database & Cache**: PostgreSQL 15, Redis Cache
- **DevOps**: Docker, Docker Compose, Nginx Reverse Proxy

---

## 🚀 Installation & Quick Start

### Option A: Run Instantly via Docker (Recommended)
Compile the entire multi-container service stack (PostgreSQL, Redis, FastAPI, React Frontend, and Nginx Gateway) in one command:
```bash
docker-compose up --build
```
Once healthy, access the local endpoints in your browser:
- **Interactive Control Portal**: [http://localhost](http://localhost)
- **API Swagger Documentation**: [http://localhost/docs](http://localhost/docs)

---

### Option B: Local Development Setup (Manual)

#### 1. Setup PostgreSQL Database
Initialize your Postgres server, create a database named `iscts`, and execute the initialization script:
```bash
psql -U postgres -d iscts -f database/schema.sql
psql -U postgres -d iscts -f database/seed.sql
```

#### 2. Start Python FastAPI Backend Server
Create and activate a virtual environment, install requirements, and run via Uvicorn:
```bash
cd backend
python -m venv venv
# Windows activate
.\venv\Scripts\activate
# Install python packages
pip install -r requirements.txt
# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Start React Frontend Dashboard
Install Node dependencies and boot the Vite server:
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running System Tests
To run automated Python unit tests asserting database tables seeding, authentication gates, and signal timing state loops:
```bash
cd backend
python -m unittest discover -s ../tests -p "test_*.py"
```

---

## 🔑 Default Sign-in Logs
Authorized personnel can authenticate at the login portal using:
- **Username**: `admin`
- **Password**: `password123`
*(Authorized as `ADMIN` with permissions to resolve active incident logs and manage manual overrides)*
