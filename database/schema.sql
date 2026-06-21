-- Integrated Smart City Traffic Solutions (ISCTS)
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TRAFFIC_OFFICER', 'OPERATOR', 'GUEST')),
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Junctions Table
CREATE TABLE IF NOT EXISTS junctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    location_lat DECIMAL(9, 6) NOT NULL,
    location_lng DECIMAL(9, 6) NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'RED' CHECK (state IN ('RED', 'YELLOW', 'GREEN', 'EMERGENCY_GREEN')),
    cycle_duration INT NOT NULL DEFAULT 120, -- in seconds
    current_green_lane VARCHAR(10) DEFAULT 'NORTH',
    adaptive_mode BOOLEAN DEFAULT TRUE,
    last_priority_override_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'OFFLINE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Detection Logs Table
CREATE TABLE IF NOT EXISTS detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    junction_id UUID REFERENCES junctions(id) ON DELETE CASCADE,
    camera_id VARCHAR(50) NOT NULL,
    lane VARCHAR(10) NOT NULL CHECK (lane IN ('NORTH', 'SOUTH', 'EAST', 'WEST')),
    car_count INT DEFAULT 0,
    bus_count INT DEFAULT 0,
    bike_count INT DEFAULT 0,
    truck_count INT DEFAULT 0,
    auto_count INT DEFAULT 0,
    ambulance_count INT DEFAULT 0,
    congestion_percentage INT DEFAULT 0 CHECK (congestion_percentage BETWEEN 0 AND 100),
    density_level VARCHAR(10) NOT NULL CHECK (density_level IN ('LOW', 'MEDIUM', 'HIGH')),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ambulance Priority Logs Table
CREATE TABLE IF NOT EXISTS ambulance_priority_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambulance_id VARCHAR(50) NOT NULL,
    junction_id UUID REFERENCES junctions(id) ON DELETE CASCADE,
    lane VARCHAR(10) NOT NULL,
    override_status VARCHAR(20) NOT NULL CHECK (override_status IN ('TRIGGERED', 'CLEARED', 'FAILED')),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cleared_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT
);

-- 5. System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL, -- 'AMBULANCE_DETECTED', 'HEAVY_CONGESTION', 'ACCIDENT_DETECTED', 'SPEED_VIOLATION'
    message TEXT NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    junction_id UUID REFERENCES junctions(id) ON DELETE CASCADE,
    lane VARCHAR(10),
    status VARCHAR(20) DEFAULT 'UNRESOLVED' CHECK (status IN ('UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_detection_logs_junction_logged_at ON detection_logs(junction_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status_severity ON system_alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_priority_logs_ambulance ON ambulance_priority_logs(ambulance_id);
