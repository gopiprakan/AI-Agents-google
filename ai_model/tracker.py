import math

class VehicleTracker:
    """Estimates lane position and tracks centroids across frames to measure approaching vehicle velocities."""
    def __init__(self):
        # Keeps track of vehicles across frames
        # Key: vehicle_id, Value: dict of vehicle details (centroid, class, frame_count)
        self.tracked_vehicles = {}
        self.next_vehicle_id = 1

    def update(self, detections: list, frame_width: int = 640, frame_height: int = 480) -> list:
        """Update tracker state with new bounding boxes, returning vehicles mapped to lanes."""
        current_centroids = []
        
        for d in detections:
            bbox = d["bbox"]
            x_min, y_min, x_max, y_max = bbox
            
            # Centroid calculations
            cx = (x_min + x_max) / 2
            cy = (y_min + y_max) / 2
            
            lane = self.estimate_lane(cx, cy, frame_width, frame_height)
            
            current_centroids.append({
                "centroid": (cx, cy),
                "bbox": bbox,
                "class_name": d["class_name"],
                "confidence": d["confidence"],
                "lane": lane
            })

        updated_tracks = []
        # Match current detections with existing tracked paths
        # (Simple greedy distance matching algorithm)
        for cur in current_centroids:
            matched_id = None
            min_dist = 50.0  # Pixels tolerance limit
            
            cx, cy = cur["centroid"]
            
            for vid, track in list(self.tracked_vehicles.items()):
                tx, ty = track["centroid"]
                dist = math.hypot(cx - tx, cy - ty)
                
                if dist < min_dist:
                    min_dist = dist
                    matched_id = vid
                    
            if matched_id is not None:
                # Update existing track
                self.tracked_vehicles[matched_id] = {
                    "centroid": (cx, cy),
                    "bbox": cur["bbox"],
                    "class_name": cur["class_name"],
                    "confidence": cur["confidence"],
                    "lane": cur["lane"],
                    "missed_frames": 0
                }
            else:
                # Create new track ID
                matched_id = f"VEH_{self.next_vehicle_id}"
                self.next_vehicle_id += 1
                self.tracked_vehicles[matched_id] = {
                    "centroid": (cx, cy),
                    "bbox": cur["bbox"],
                    "class_name": cur["class_name"],
                    "confidence": cur["confidence"],
                    "lane": cur["lane"],
                    "missed_frames": 0
                }
                
            cur["id"] = matched_id
            updated_tracks.append(cur)

        # Decay missed tracking IDs
        for vid, track in list(self.tracked_vehicles.items()):
            # If track wasn't updated this cycle, increment missed frames
            is_found = any(ut["id"] == vid for ut in updated_tracks)
            if not is_found:
                track["missed_frames"] += 1
                if track["missed_frames"] > 5:
                    del self.tracked_vehicles[vid]
                    
        return updated_tracks

    def estimate_lane(self, cx: float, cy: float, width: int, height: int) -> str:
        """Divide coordinate dimensions into virtual quadrants to estimate incoming lane."""
        # Simple projection: divide the canvas horizontally/vertically
        # For a standard junction view, we can define lanes as NORTH, SOUTH, EAST, WEST approaches
        # based on where the centroid lies.
        half_w = width / 2
        half_h = height / 2
        
        if cx < half_w and cy < half_h:
            return "WEST"
        elif cx >= half_w and cy < half_h:
            return "NORTH"
        elif cx < half_w and cy >= half_h:
            return "SOUTH"
        else:
            return "EAST"

# Instantiate tracker singleton
tracker = VehicleTracker()
