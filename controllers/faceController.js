const Face = require('../models/Face');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all faces
// @route   GET /api/faces
// @access  Private
exports.getFaces = async (req, res) => {
    try {
        const faces = await Face.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: faces.length,
            data: faces
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get single face
// @route   GET /api/faces/:id
// @access  Private
exports.getFace = async (req, res) => {
    try {
        const face = await Face.findById(req.params.id);
        
        if (!face) {
            return res.status(404).json({ success: false, message: 'Face not found' });
        }
        
        res.status(200).json({
            success: true,
            data: face
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create new face
// @route   POST /api/faces
// @access  Private
exports.createFace = async (req, res) => {
    try {
        const { name, category, notes } = req.body;
        
        if (!req.files || !req.files.image) {
            return res.status(400).json({ success: false, message: 'Please upload an image file' });
        }
        
        const image = req.files.image;
        
        // Make sure the image is a photo
        if (!image.mimetype.startsWith('image')) {
            return res.status(400).json({ success: false, message: 'Please upload an image file' });
        }
        
        // Check file size (max 5MB)
        if (image.size > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'Image must be less than 5MB' });
        }
        
        // Create custom filename
        const fileName = `${uuidv4()}${path.parse(image.name).ext}`;
        
        // Move file to upload directory
        const uploadPath = path.join(__dirname, '../uploads/faces', fileName);
        
        image.mv(uploadPath, async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Problem with file upload' });
            }
            
            // For now, we'll use a placeholder for face encodings
            // In a real implementation, this would use a face recognition library
            const placeholderEncodings = Array(128).fill(0).map(() => Math.random());
            
            // Create face in database
            const face = await Face.create({
                name,
                category,
                notes,
                imagePath: `uploads/faces/${fileName}`,
                encodings: placeholderEncodings,
                createdBy: req.user.id
            });
            
            res.status(201).json({
                success: true,
                data: face
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update face
// @route   PUT /api/faces/:id
// @access  Private
exports.updateFace = async (req, res) => {
    try {
        let face = await Face.findById(req.params.id);
        
        if (!face) {
            return res.status(404).json({ success: false, message: 'Face not found' });
        }
        
        // Update fields
        const { name, category, notes } = req.body;
        const updateData = { name, category, notes };
        
        // Handle image upload if included
        if (req.files && req.files.image) {
            const image = req.files.image;
            
            // Make sure the image is a photo
            if (!image.mimetype.startsWith('image')) {
                return res.status(400).json({ success: false, message: 'Please upload an image file' });
            }
            
            // Check file size (max 5MB)
            if (image.size > 5 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'Image must be less than 5MB' });
            }
            
            // Create custom filename
            const fileName = `${uuidv4()}${path.parse(image.name).ext}`;
            
            // Move file to upload directory
            const uploadPath = path.join(__dirname, '../uploads/faces', fileName);
            
            // Delete old image
            if (face.imagePath) {
                const oldImagePath = path.join(__dirname, '..', face.imagePath);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            // Upload new image
            await image.mv(uploadPath);
            
            // Update image path
            updateData.imagePath = `uploads/faces/${fileName}`;
            
            // For a real implementation, we would recalculate face encodings here
            const placeholderEncodings = Array(128).fill(0).map(() => Math.random());
            updateData.encodings = placeholderEncodings;
        }
        
        // Update face in database
        face = await Face.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
        
        res.status(200).json({
            success: true,
            data: face
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete face
// @route   DELETE /api/faces/:id
// @access  Private
exports.deleteFace = async (req, res) => {
    try {
        const face = await Face.findById(req.params.id);
        
        if (!face) {
            return res.status(404).json({ success: false, message: 'Face not found' });
        }
        
        // Delete image file
        if (face.imagePath) {
            const imagePath = path.join(__dirname, '..', face.imagePath);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Delete face from database
        await Face.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
