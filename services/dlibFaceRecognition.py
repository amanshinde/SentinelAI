#!/usr/bin/env python3
"""
Dlib-based Face Recognition Service for SentinelAI
Uses pre-trained dlib models for accurate face detection and recognition
"""

import dlib
import cv2
import numpy as np
import json
import sys
import os
from pathlib import Path
import argparse
import base64
from io import BytesIO
from PIL import Image

class DlibFaceRecognitionService:
    def __init__(self, models_path="data_dlib"):
        """Initialize the dlib face recognition service"""
        self.models_path = Path(models_path)
        self.detector = None
        self.predictor = None
        self.face_encoder = None
        self.is_initialized = False
        
    def initialize(self):
        """Load dlib models"""
        try:
            # Paths to model files
            predictor_path = self.models_path / "shape_predictor_68_face_landmarks.dat"
            encoder_path = self.models_path / "dlib_face_recognition_resnet_model_v1.dat"
            
            if not predictor_path.exists():
                raise FileNotFoundError(f"Landmark predictor not found: {predictor_path}")
            if not encoder_path.exists():
                raise FileNotFoundError(f"Face encoder not found: {encoder_path}")
            
            # Initialize dlib components
            self.detector = dlib.get_frontal_face_detector()
            self.predictor = dlib.shape_predictor(str(predictor_path))
            self.face_encoder = dlib.face_recognition_model_v1(str(encoder_path))
            
            self.is_initialized = True
            return {"success": True, "message": "Dlib face recognition initialized successfully"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def detect_faces(self, image_path):
        """Detect faces in an image and return bounding boxes"""
        if not self.is_initialized:
            return {"success": False, "error": "Service not initialized"}
        
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {"success": False, "error": "Could not load image"}
            
            # Convert to RGB (dlib uses RGB)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            faces = self.detector(rgb_image)
            
            detections = []
            for face in faces:
                # Get bounding box
                x, y, w, h = face.left(), face.top(), face.width(), face.height()
                
                # Get landmarks
                landmarks = self.predictor(rgb_image, face)
                
                # Generate face encoding
                face_encoding = self.face_encoder.compute_face_descriptor(rgb_image, landmarks)
                encoding_list = [float(x) for x in face_encoding]
                
                detection = {
                    "box": {"x": x, "y": y, "width": w, "height": h},
                    "landmarks": self._landmarks_to_dict(landmarks),
                    "encoding": encoding_list,
                    "confidence": 0.9  # dlib doesn't provide confidence, use high default
                }
                detections.append(detection)
            
            return {
                "success": True,
                "detections": detections,
                "count": len(detections)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_encoding(self, image_path):
        """Generate face encoding for a single face"""
        result = self.detect_faces(image_path)
        
        if not result["success"]:
            return result
        
        if result["count"] == 0:
            return {"success": False, "error": "No faces detected in image"}
        
        # Return encoding of first (largest) face
        encoding = result["detections"][0]["encoding"]
        return {"success": True, "encoding": encoding}
    
    def compare_faces(self, encoding1, encoding2, threshold=0.6):
        """Compare two face encodings"""
        try:
            # Convert to numpy arrays
            enc1 = np.array(encoding1)
            enc2 = np.array(encoding2)
            
            # Calculate Euclidean distance
            distance = np.linalg.norm(enc1 - enc2)
            
            # Determine if it's a match
            is_match = distance < threshold
            confidence = max(0, 1 - distance)
            
            return {
                "success": True,
                "distance": float(distance),
                "match": is_match,
                "confidence": float(confidence)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def find_best_match(self, unknown_encoding, known_encodings, threshold=0.6):
        """Find best match from a list of known encodings"""
        try:
            best_match = None
            best_distance = float('inf')
            
            for i, known_face in enumerate(known_encodings):
                comparison = self.compare_faces(unknown_encoding, known_face["encoding"], threshold)
                
                if comparison["success"] and comparison["match"]:
                    if comparison["distance"] < best_distance:
                        best_distance = comparison["distance"]
                        best_match = {
                            **known_face,
                            "distance": comparison["distance"],
                            "confidence": comparison["confidence"],
                            "index": i
                        }
            
            return {
                "success": True,
                "match": best_match,
                "best_distance": best_distance if best_match else None
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _landmarks_to_dict(self, landmarks):
        """Convert dlib landmarks to dictionary format"""
        points = []
        for i in range(landmarks.num_parts):
            point = landmarks.part(i)
            points.append({"x": point.x, "y": point.y})
        return {"points": points}

def main():
    """Command line interface for the face recognition service"""
    parser = argparse.ArgumentParser(description='Dlib Face Recognition Service')
    parser.add_argument('command', choices=['init', 'detect', 'encode', 'compare', 'match'])
    parser.add_argument('--image', help='Path to image file')
    parser.add_argument('--encoding1', help='First encoding (JSON)')
    parser.add_argument('--encoding2', help='Second encoding (JSON)')
    parser.add_argument('--known-encodings', help='Known encodings (JSON)')
    parser.add_argument('--threshold', type=float, default=0.6, help='Matching threshold')
    parser.add_argument('--models-path', default='data_dlib', help='Path to dlib models')
    
    args = parser.parse_args()
    
    # Initialize service
    service = DlibFaceRecognitionService(args.models_path)
    
    if args.command == 'init':
        result = service.initialize()
    elif args.command == 'detect':
        if not args.image:
            result = {"success": False, "error": "Image path required"}
        else:
            service.initialize()
            result = service.detect_faces(args.image)
    elif args.command == 'encode':
        if not args.image:
            result = {"success": False, "error": "Image path required"}
        else:
            service.initialize()
            result = service.generate_encoding(args.image)
    elif args.command == 'compare':
        if not args.encoding1 or not args.encoding2:
            result = {"success": False, "error": "Both encodings required"}
        else:
            service.initialize()
            enc1 = json.loads(args.encoding1)
            enc2 = json.loads(args.encoding2)
            result = service.compare_faces(enc1, enc2, args.threshold)
    elif args.command == 'match':
        if not args.encoding1 or not args.known_encodings:
            result = {"success": False, "error": "Unknown encoding and known encodings required"}
        else:
            service.initialize()
            unknown = json.loads(args.encoding1)
            known = json.loads(args.known_encodings)
            result = service.find_best_match(unknown, known, args.threshold)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
