const Detection = require('../models/Detection');
const Setting = require('../models/Setting');
const nodemailer = require('nodemailer');
const path = require('path');

// @desc    Get all detections
// @route   GET /api/detections
// @access  Private
exports.getDetections = async (req, res) => {
    try {
        // Build query
        const query = {};
        
        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            // Set end date to end of day in local timezone
            endDate.setHours(23, 59, 59, 999);
            
            // Add timezone offset to handle IST properly
            const timezoneOffset = new Date().getTimezoneOffset() * 60000;
            const localStartDate = new Date(startDate.getTime() - timezoneOffset);
            const localEndDate = new Date(endDate.getTime() - timezoneOffset);
            
            query.timestamp = {
                $gte: localStartDate,
                $lte: localEndDate
            };
            
            console.log('Detection query date range (local):', { 
                startDate: localStartDate.toISOString(), 
                endDate: localEndDate.toISOString(),
                originalStart: req.query.startDate,
                originalEnd: req.query.endDate,
                timezoneOffset: timezoneOffset / 60000 + ' minutes'
            });
        }
        
        // Filter by camera
        if (req.query.camera) {
            query.camera = req.query.camera;
        }
        
        // Filter by face category
        if (req.query.category) {
            // This requires a join with the Face model
            // We'll handle this in the populate stage
        }
        
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        
        console.log('Detection query:', query);
        
        // Execute query
        const detections = await Detection.find(query)
            .populate({
                path: 'face',
                select: 'name category imagePath'
            })
            .populate({
                path: 'camera',
                select: 'name location'
            })
            .sort({ timestamp: -1 })
            .skip(startIndex)
            .limit(limit);
        
        console.log(`Found ${detections.length} detections`);
        
        // Get total count
        const total = await Detection.countDocuments(query);
        
        console.log('Detection response:', { 
            count: detections.length, 
            total, 
            page, 
            limit,
            query: req.query 
        });
        
        res.status(200).json({
            success: true,
            count: detections.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: detections
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get single detection
// @route   GET /api/detections/:id
// @access  Private
exports.getDetection = async (req, res) => {
    try {
        const detection = await Detection.findById(req.params.id)
            .populate({
                path: 'face',
                select: 'name category imagePath'
            })
            .populate({
                path: 'camera',
                select: 'name location'
            });
        
        if (!detection) {
            return res.status(404).json({ success: false, message: 'Detection not found' });
        }
        
        res.status(200).json({
            success: true,
            data: detection
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create new detection
// @route   POST /api/detections
// @access  Private
exports.createDetection = async (req, res) => {
    try {
        const { face, camera, confidence } = req.body;
        
        if (!req.files || !req.files.image) {
            return res.status(400).json({ success: false, message: 'Please upload an image file' });
        }
        
        const image = req.files.image;
        
        // Make sure the image is a photo
        if (!image.mimetype.startsWith('image')) {
            return res.status(400).json({ success: false, message: 'Please upload an image file' });
        }
        
        // Create custom filename with timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const fileName = `detection_${timestamp}${path.parse(image.name).ext}`;
        
        // Move file to upload directory
        const uploadPath = path.join(__dirname, '../uploads/detections', fileName);
        
        image.mv(uploadPath, async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Problem with file upload' });
            }
            
            // Create detection in database
            const detection = await Detection.create({
                face,
                camera,
                confidence,
                imagePath: `uploads/detections/${fileName}`
            });
            
            // Populate face and camera details for response
            const populatedDetection = await Detection.findById(detection._id)
                .populate({
                    path: 'face',
                    select: 'name category imagePath'
                })
                .populate({
                    path: 'camera',
                    select: 'name location'
                });
            
            // Send notification if enabled
            await sendDetectionNotification(populatedDetection);
            
            res.status(201).json({
                success: true,
                data: populatedDetection
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete detection
// @route   DELETE /api/detections/:id
// @access  Private
exports.deleteDetection = async (req, res) => {
    try {
        const detection = await Detection.findById(req.params.id);
        
        if (!detection) {
            return res.status(404).json({ success: false, message: 'Detection not found' });
        }
        
        // Delete detection from database
        await Detection.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Helper function to send email notification for detection
async function sendDetectionNotification(detection) {
    try {
        // Get settings
        const settings = await Setting.findOne();
        
        // Check if notifications are enabled
        if (!settings || !settings.enableNotifications) {
            return;
        }
        
        // Check if we should only notify for restricted category
        if (settings.notifyOnlyRestricted && detection.face.category !== 'restricted') {
            return;
        }
        
        // Check if we have an email to send to
        if (!settings.notificationEmail) {
            return;
        }
        
        // Create email transporter (this should be configured with real SMTP settings)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || 'user@example.com',
                pass: process.env.SMTP_PASSWORD || 'password'
            }
        });
        
        // Format timestamp
        const timestamp = new Date(detection.timestamp).toLocaleString();
        
        // Send email
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"SentinelAI System" <system@sentinelai.com>',
            to: settings.notificationEmail,
            subject: `SentinelAI Alert: ${detection.face.name} Detected`,
            html: `
                <h2>Face Detection Alert</h2>
                <p><strong>Person:</strong> ${detection.face.name}</p>
                <p><strong>Category:</strong> ${detection.face.category}</p>
                <p><strong>Camera:</strong> ${detection.camera.name}</p>
                <p><strong>Location:</strong> ${detection.camera.location}</p>
                <p><strong>Time:</strong> ${timestamp}</p>
                <p><strong>Confidence:</strong> ${(detection.confidence * 100).toFixed(2)}%</p>
                <p>Please log in to the system for more details.</p>
            `
        });
        
        // Update detection to mark as notified
        await Detection.findByIdAndUpdate(detection._id, { notified: true });
        
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
