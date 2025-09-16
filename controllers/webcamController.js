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

// @desc    Process webcam frame for face detection
// @route   POST /api/cameras/webcam/detect
// @access  Private
exports.processWebcamFrame = async (req, res) => {
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

            if (bestMatch && bestMatch.confidence > 0.7) {
                // Save detection image
                const detectionFileName = `detection_${Date.now()}_${uuidv4()}.jpg`;
                const detectionPath = path.join(__dirname, '../uploads/detections', detectionFileName);
                
                // Copy temp file to detection file
                fs.copyFileSync(tempPath, detectionPath);

                // Create detection record
                const detection = await Detection.create({
                    face: bestMatch.id,
                    camera: webcamCamera._id,
                    confidence: bestMatch.confidence,
                    imagePath: `uploads/detections/${detectionFileName}`
                });

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
