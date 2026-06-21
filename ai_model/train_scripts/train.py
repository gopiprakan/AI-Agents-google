import os
import argparse
from ultralytics import YOLO

def main():
    parser = argparse.ArgumentParser(description="Train YOLOv8 on Smart City Traffic Dataset")
    parser.add_argument("--data", type=str, default="dataset_config.yaml", help="Path to dataset config YAML file")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--weights", type=str, default="yolov8n.pt", help="Initial weights path")
    parser.add_argument("--device", type=str, default="cpu", help="Device to train on (e.g. cpu, 0, cuda:0)")
    parser.add_argument("--project", type=str, default="iscts_traffic", help="Project name to save training artifacts")
    
    args = parser.parse_args()

    # Verify dataset yaml config exists
    if not os.path.exists(args.data):
        print(f"Error: Dataset configuration file not found at: {args.data}")
        print("Please ensure the configuration exists before running training.")
        return

    print(f"Initializing YOLO model: {args.weights}...")
    model = YOLO(args.weights)

    print(f"Starting training on {args.device} for {args.epochs} epochs...")
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        project=args.project,
        name="traffic_detector",
        save=True,
        cache=True,
        workers=4
    )

    print("Training complete. Validating model Performance...")
    metrics = model.val()
    print(f"Validation mAP50-95: {metrics.box.map:.4f}")

    # Export model to ONNX format for deployment
    print("Exporting model to ONNX format...")
    path = model.export(format="onnx")
    print(f"Model exported successfully to ONNX at: {path}")

if __name__ == "__main__":
    main()
