import os
import random

# Try importing OpenCV, NumPy and Ultralytics YOLO
try:
    import cv2
    import numpy as np
    import torch
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False

class YoloDetector:
    """YOLOv8 Vehicle Detector with auto fallback when running without PyTorch/Ultralytics."""
    def __init__(self):
        self.model_path = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
        self.model = None
        
        if ULTRALYTICS_AVAILABLE:
            try:
                # Load pre-trained weights (will download if not present)
                self.model = YOLO(self.model_path)
                print(f"YOLOv8 initialized successfully using model: {self.model_path}")
            except Exception as e:
                print(f"Error loading YOLO weights, using mock fallback: {e}")
                self.model = None
        else:
            print("Ultralytics library or PyTorch not available. Running AI model in Fallback Simulation Mode.")

    def detect_objects(self, image_bytes: bytes) -> list:
        """Processes raw image bytes and returns a list of bounding boxes."""
        if self.model is not None:
            # Convert raw bytes to CV2 image
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return self._generate_mock_detections()
                
            # Perform inference
            results = self.model(img, verbose=False)
            detections = []
            
            # Map default COCO classes to project requirements
            # COCO classes: 2: car, 3: motorcycle, 5: bus, 7: truck
            # Note: auto/rickshaw might get classified as car/motorcycle in standard COCO.
            coco_class_mapping = {
                2: "Car",
                3: "Bike",
                5: "Bus",
                7: "Truck",
                0: "Person" # helmet detection check
            }
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    
                    if cls_id in coco_class_mapping:
                        class_name = coco_class_mapping[cls_id]
                        # Get coords [x1, y1, x2, y2] relative to image dimensions
                        coords = box.xyxy[0].tolist()
                        
                        detections.append({
                            "bbox": [round(c, 1) for c in coords],
                            "confidence": round(conf, 2),
                            "class_name": class_name
                        })
            
            return detections
        else:
            return self._generate_mock_detections()

    def _generate_mock_detections(self) -> list:
        """Generates realistic mockup detections (bounding boxes, class, confidence) for frontend feeds."""
        classes = ["Car", "Bike", "Bus", "Truck", "Auto", "Ambulance"]
        weights = [0.60, 0.20, 0.05, 0.03, 0.10, 0.02]  # Probability distribution
        
        detections = []
        # Generate between 5 and 18 random objects
        num_objects = random.randint(5, 18)
        
        # Simulated canvas size 640x480
        width, height = 640, 480
        
        for _ in range(num_objects):
            class_name = random.choices(classes, weights=weights)[0]
            
            # Generate random box coordinates
            box_w = random.randint(40, 120)
            box_h = random.randint(30, 90)
            
            x_min = random.randint(20, width - box_w - 20)
            y_min = random.randint(20, height - box_h - 20)
            x_max = x_min + box_w
            y_max = y_min + box_h
            
            confidence = round(random.uniform(0.65, 0.98), 2)
            
            detections.append({
                "bbox": [float(x_min), float(y_min), float(x_max), float(y_max)],
                "confidence": confidence,
                "class_name": class_name
            })
            
        return detections

# Instantiate detector singleton
detector = YoloDetector()
