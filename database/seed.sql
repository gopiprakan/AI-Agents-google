-- Integrated Smart City Traffic Solutions (ISCTS)
-- Database Seed Script

-- 1. Insert Default Junctions
-- We'll seed 4 major smart junctions in the city center.
INSERT INTO junctions (id, name, location_lat, location_lng, state, cycle_duration, current_green_lane, adaptive_mode, status)
VALUES
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'Junction Alpha (North Grid)', 12.9715987, 77.5945627, 'GREEN', 90, 'NORTH', TRUE, 'ACTIVE'),
  ('c1a2e3b4-1234-5678-90ab-cdef11113333', 'Junction Beta (Commercial St)', 12.9815987, 77.6045627, 'RED', 120, 'EAST', TRUE, 'ACTIVE'),
  ('c1a2e3b4-1234-5678-90ab-cdef11114444', 'Junction Gamma (Ring Road)', 12.9515987, 77.5845627, 'RED', 120, 'SOUTH', TRUE, 'ACTIVE'),
  ('c1a2e3b4-1234-5678-90ab-cdef11115555', 'Junction Delta (Tech Park)', 12.9915987, 77.6145627, 'YELLOW', 90, 'WEST', TRUE, 'ACTIVE')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Users
-- Passwords are encrypted for safety (example hash for 'password123' using bcrypt is used)
-- admin / password123: $2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6
-- officer / password123: $2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6
INSERT INTO users (id, username, email, password_hash, role, full_name)
VALUES
  ('a1b2c3d4-5678-9012-3456-7890abcdef11', 'admin', 'admin@iscts.gov', '$2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6', 'ADMIN', 'Super Administrator'),
  ('a1b2c3d4-5678-9012-3456-7890abcdef22', 'officer_smith', 'smith@iscts.gov', '$2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6', 'TRAFFIC_OFFICER', 'Officer John Smith'),
  ('a1b2c3d4-5678-9012-3456-7890abcdef33', 'operator_doe', 'doe@iscts.gov', '$2b$12$e7k1Q7pM9j6a8R05U2NfEe/N6U.t8jQo2T3l/K41K99/t5YnKbeT6', 'OPERATOR', 'Operator Jane Doe')
ON CONFLICT (username) DO NOTHING;

-- 3. Insert Historical Detection Logs (Past 1 hour)
INSERT INTO detection_logs (junction_id, camera_id, lane, car_count, bus_count, bike_count, truck_count, auto_count, ambulance_count, congestion_percentage, density_level, logged_at)
VALUES
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_NORTH', 'NORTH', 12, 2, 8, 1, 3, 0, 35, 'LOW', NOW() - INTERVAL '30 minutes'),
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_SOUTH', 'SOUTH', 25, 4, 15, 3, 6, 0, 65, 'MEDIUM', NOW() - INTERVAL '30 minutes'),
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_EAST', 'EAST', 45, 6, 20, 8, 12, 1, 85, 'HIGH', NOW() - INTERVAL '30 minutes'),
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_WEST', 'WEST', 18, 1, 10, 2, 4, 0, 45, 'MEDIUM', NOW() - INTERVAL '30 minutes'),

  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_NORTH', 'NORTH', 15, 3, 10, 2, 4, 0, 42, 'MEDIUM', NOW() - INTERVAL '15 minutes'),
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_SOUTH', 'SOUTH', 28, 5, 18, 2, 7, 0, 70, 'HIGH', NOW() - INTERVAL '15 minutes'),
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_EAST', 'EAST', 10, 1, 5, 0, 2, 0, 20, 'LOW', NOW() - INTERVAL '15 minutes'),
  ('c1a2e3b4-1234-5678-90ab-cdef11112222', 'CAM_ALPHA_WEST', 'WEST', 22, 2, 12, 3, 5, 0, 55, 'MEDIUM', NOW() - INTERVAL '15 minutes');

-- 4. Insert Sample Alerts
INSERT INTO system_alerts (alert_type, message, severity, junction_id, lane, status, created_at)
VALUES
  ('HEAVY_CONGESTION', 'Heavy congestion detected on Junction Alpha Eastbound (85% congestion score)', 'WARNING', 'c1a2e3b4-1234-5678-90ab-cdef11112222', 'EAST', 'UNRESOLVED', NOW() - INTERVAL '10 minutes'),
  ('AMBULANCE_DETECTED', 'Emergency override active: Ambulance AMB-911 detected on Junction Alpha Eastbound', 'CRITICAL', 'c1a2e3b4-1234-5678-90ab-cdef11112222', 'EAST', 'RESOLVED', NOW() - INTERVAL '8 minutes'),
  ('ACCIDENT_DETECTED', 'Potential accident incident detected at Junction Beta (Northbound lane block)', 'CRITICAL', 'c1a2e3b4-1234-5678-90ab-cdef11113333', 'NORTH', 'UNRESOLVED', NOW() - INTERVAL '2 minutes');

-- 5. Insert Ambulance Priority Log
INSERT INTO ambulance_priority_logs (ambulance_id, junction_id, lane, override_status, triggered_at, cleared_at, duration_seconds)
VALUES
  ('AMB-911', 'c1a2e3b4-1234-5678-90ab-cdef11112222', 'EAST', 'CLEARED', NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '7 minutes', 60);
