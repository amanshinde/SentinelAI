const Camera = require('../models/Camera');
const Face = require('../models/Face');
const Detection = require('../models/Detection');
const faceRecognitionService = require('../services/faceRecognitionService');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// @desc    Start webcam surveillance
// @route   POST /api/cameras/webcam/start
// @access  Private
exports.startWebcamSurveillance = async (req, res) => {
    try {
        // Initialize face recognition service
        await faceRecognitionService.initialize();
        
        // Create or update webcam camera entry
        let webcamCamera = await Camera.findOne({ name: 'Webcam' });
        
        if (!webcamCamera) {
            webcamCamera = await Camera.create({
                name: 'Webcam',
                url: 'webcam',
                location: 'Local Device',
                isActive: true,
                isConnected: true,
                createdBy: req.user.id
            });
        } else {
            webcamCamera.isActive = true;
            webcamCamera.isConnected = true;
            await webcamCamera.save();
        }
        
        res.status(200).json({
            success: true,
            message: 'Webcam surveillance started',
            data: webcamCamera
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Stop webcam surveillance
// @route   POST /api/cameras/webcam/stop
// @access  Private
exports.stopWebcamSurveillance = async (req, res) => {
    try {
        const webcamCamera = await Camera.findOne({ name: 'Webcam' });
        
        if (webcamCamera) {
            webcamCamera.isActive = false;
            webcamCamera.isConnected = false;
            await webcamCamera.save();
        }
        
        res.status(200).json({
            success: true,
            message: 'Webcam surveillance stopped',
            data: webcamCamera
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Store last detection times for each face to throttle logging
const lastDetectionTimes = new Map();

// @desc    Detect faces in webcam frame
// @route   POST /api/cameras/webcam/detect
// @access  Private
exports.detectWebcamFrame = async (req, res) => {
    try {
        if (!req.files || !req.files.frame) {
            return res.status(400).json({ success: false, message: 'No frame provided' });
        }

        const frameImage = req.files.frame;
        
        // Create temporary file for processing
        const tempFileName = `temp_${uuidv4()}.jpg`;
        const tempPath = path.join(__dirname, '../uploads/temp', tempFileName);
        
        // Ensure temp directory exists
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        await frameImage.mv(tempPath);

        // Initialize face recognition service
        await faceRecognitionService.initialize();
        
        // Detect faces in the frame
        const detectedFaces = await faceRecognitionService.detectFaces(tempPath);
        
        if (detectedFaces.length === 0) {
            // Clean up temp file
            fs.unlinkSync(tempPath);
            return res.status(200).json({
                success: true,
                message: 'No faces detected',
                detections: []
            });
        }

        // Get all known faces from database
        const knownFaces = await Face.find().select('name category encodings');
        
        if (knownFaces.length === 0) {
            // Clean up temp file
            fs.unlinkSync(tempPath);
            return res.status(200).json({
                success: true,
                message: 'No known faces in database',
                detections: []
            });
        }
        
        const knownEncodings = knownFaces.map(face => ({
            id: face._id,
            name: face.name,
            category: face.category,
            encoding: face.encodings
        }));

        const results = [];
        
        // Find or create webcam camera
        let webcamCamera = await Camera.findOne({ name: 'Webcam' });
        if (!webcamCamera) {
            webcamCamera = await Camera.create({
                name: 'Webcam',
                location: 'Local Computer',
                status: 'active',
                createdBy: req.user.id
            });
        }
        
        for (const detectedFace of detectedFaces) {
            // Get face encoding - handle both dlib and fallback formats
            const faceEncoding = detectedFace.encoding || detectedFace.descriptor;
            
            if (!faceEncoding) {
                console.warn('No encoding found for detected face, skipping');
                continue;
            }
            
            // Find best match for this face
            const bestMatch = await faceRecognitionService.findBestMatch(
                faceEncoding,
                knownEncodings,
                0.6
            );

            console.log('Face matching result:', { 
                hasMatch: !!bestMatch, 
                confidence: bestMatch?.confidence, 
                threshold: 0.6,
                matchName: bestMatch?.name 
            });

            if (bestMatch && bestMatch.confidence > 0.4) { // Lower threshold for testing
                // Check if we should throttle this detection (only log once per minute per face)
                const now = Date.now();
                const lastDetectionTime = lastDetectionTimes.get(bestMatch.id);
                const oneMinute = 60 * 1000; // 60 seconds in milliseconds
                
                if (lastDetectionTime && (now - lastDetectionTime) < oneMinute) {
                    console.log(`Throttling detection for ${bestMatch.name} - last logged ${Math.round((now - lastDetectionTime) / 1000)}s ago`);
                    // Still return the match but don't create a new detection record
                    results.push({
                        detection: null, // No new detection record
                        box: detectedFace.box,
                        match: {
                            name: bestMatch.name,
                            category: bestMatch.category,
                            confidence: bestMatch.confidence
                        },
                        throttled: true
                    });
                    continue;
                }
                
                console.log(`Creating detection record for: ${bestMatch.name} (confidence: ${bestMatch.confidence})`);
                
                // Update last detection time for this face
                lastDetectionTimes.set(bestMatch.id, now);
                
                // Save detection image
                const detectionFileName = `detection_${Date.now()}_${uuidv4()}.jpg`;
                const detectionPath = path.join(__dirname, '../uploads/detections', detectionFileName);
                
                // Ensure detections directory exists
                const detectionsDir = path.dirname(detectionPath);
                if (!fs.existsSync(detectionsDir)) {
                    fs.mkdirSync(detectionsDir, { recursive: true });
                }
                
                // Copy temp file to detection file
                fs.copyFileSync(tempPath, detectionPath);

                // Create detection record
                const detection = await Detection.create({
                    face: bestMatch.id,
                    camera: webcamCamera._id,
                    confidence: bestMatch.confidence,
                    imagePath: `uploads/detections/${detectionFileName}`
                });

                console.log('Detection record created:', detection._id);

                // Populate detection for response
                const populatedDetection = await Detection.findById(detection._id)
                    .populate('face', 'name category')
                    .populate('camera', 'name location');

                results.push({
                    detection: populatedDetection,
                    box: detectedFace.box,
                    match: {
                        name: bestMatch.name,
                        category: bestMatch.category,
                        confidence: bestMatch.confidence
                    }
                });

                console.log(`Detection saved: ${bestMatch.name} at ${new Date().toISOString()}`);
            } else {
                console.log('No match found or confidence too low for detection logging');
            }
        }

        // Clean up temp file
        fs.unlinkSync(tempPath);

        res.status(200).json({
            success: true,
            message: `Processed ${detectedFaces.length} faces, ${results.length} matches found`,
            detections: results
        });

    } catch (error) {
        console.error('Webcam processing error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
