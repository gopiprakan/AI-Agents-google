# ISCTS Traffic Datasets Directory

This folder holds datasets used to train the YOLOv8 vehicle detection models.

## Dataset Structure
Prepare your image annotations in standard YOLO format (`.txt` files containing `<class_id> <x_center> <y_center> <width> <height>` coordinates normalized between 0 and 1).

Structure the assets as follows:
```text
datasets/
├── train/
│   ├── images/
│   │   ├── frame_001.jpg
│   │   └── frame_002.jpg
│   └── labels/
│       ├── frame_001.txt
│       └── frame_002.txt
└── val/
    ├── images/
    │   └── frame_101.jpg
    └── labels/
        └── frame_101.txt
```

## Class Identifiers (nc: 6)
- `0`: Car
- `1`: Bus
- `2`: Bike
- `3`: Truck
- `4`: Auto
- `5`: Ambulance
