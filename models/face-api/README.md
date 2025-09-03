# Face-API.js Models Directory

This directory should contain the pre-trained models for face-api.js. 

## Required Models

Download the following model files from the face-api.js repository and place them in this directory:

1. **ssd_mobilenetv1_model-weights_manifest.json**
2. **ssd_mobilenetv1_model-shard1**
3. **face_landmark_68_model-weights_manifest.json** 
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**
7. **face_recognition_model-shard2**

## Download Instructions

1. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download all the files listed above
3. Place them in this directory (`models/face-api/`)

## Alternative Setup

If you prefer to use the fallback mode (random encodings for testing), the system will work without these models but won't perform actual face recognition.

## File Structure

After downloading, your directory should look like:
```
models/face-api/
├── ssd_mobilenetv1_model-weights_manifest.json
├── ssd_mobilenetv1_model-shard1
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1
├── face_recognition_model-shard2
└── README.md
```
