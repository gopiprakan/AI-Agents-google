import unittest
import json
from fastapi.testclient import TestClient

# Import app to mount TestClient
# Use local try import to avoid crashes if environment variables are not loaded
try:
    from backend.app.main import app
    from backend.app.database import Base, engine, SessionLocal, Junction
    client = TestClient(app)
    DATABASE_TESTABLE = True
except ImportError:
    DATABASE_TESTABLE = False

class TestISCTSBackend(unittest.TestCase):
    
    def setUp(self):
        if not DATABASE_TESTABLE:
            self.skipTest("Database or FastAPI components not importable in test runner environment.")
        # Setup tables
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()
        
    def tearDown(self):
        if DATABASE_TESTABLE:
            self.db.close()

    def test_root_status(self):
        """Verify API is online."""
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("online", response.json()["status"])

    def test_get_junctions(self):
        """Test listing traffic light junctions from DB."""
        response = client.get("/api/signal/junctions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data), 0)
        self.assertEqual(data[0]["status"], "ACTIVE")

    def test_unauthorized_admin_action(self):
        """Verify endpoints restrict modifications without tokens."""
        payload = {
            "id": "c1a2e3b4-1234-5678-90ab-cdef11112222",
            "adaptive_mode": False
        }
        response = client.post("/api/signal/update", json=payload)
        self.assertEqual(response.status_code, 401)  # Unauthorized without credentials

    def test_trigger_and_clear_priority(self):
        """Test emergency override activation and manual reset loops."""
        # Active override
        payload = {
            "ambulance_id": "AMB-TEST-99",
            "junction_id": "c1a2e3b4-1234-5678-90ab-cdef11112222",
            "lane": "NORTH",
            "duration_seconds": 15
        }
        
        response = client.post("/api/signal/override", json=payload)
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertEqual(res_data["status"], "success")
        
        # Verify junction states updated to EMERGENCY_GREEN
        junction_res = client.get("/api/signal/junctions")
        junctions = junction_res.json()
        target_j = next(j for j in junctions if j["id"] == "c1a2e3b4-1234-5678-90ab-cdef11112222")
        self.assertEqual(target_j["state"], "EMERGENCY_GREEN")
        self.assertEqual(target_j["current_green_lane"], "NORTH")
        
        # Clear override
        clear_payload = {
            "junction_id": "c1a2e3b4-1234-5678-90ab-cdef11112222"
        }
        clear_res = client.post("/api/signal/override/clear", json=clear_payload)
        self.assertEqual(clear_res.status_code, 200)
        self.assertEqual(clear_res.json()["status"], "success")

if __name__ == "__main__":
    unittest.main()
