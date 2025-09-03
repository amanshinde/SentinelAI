const Camera = require('../models/Camera');
const Face = require('../models/Face');
const Detection = require('../models/Detection');
const faceRecognitionService = require('../services/faceRecognitionService');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all cameras
// @route   GET /api/cameras
// @access  Private
exports.getCameras = async (req, res) => {
    try {
        const cameras = await Camera.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: cameras.length,
            data: cameras
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get single camera
// @route   GET /api/cameras/:id
// @access  Private
exports.getCamera = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        
        if (!camera) {
            return res.status(404).json({ success: false, message: 'Camera not found' });
        }
        
        res.status(200).json({
            success: true,
            data: camera
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create new camera
// @route   POST /api/cameras
// @access  Private
exports.createCamera = async (req, res) => {
    try {
        const { name, url, location } = req.body;
        
        // Create camera in database
        const camera = await Camera.create({
            name,
            url,
            location,
            createdBy: req.user.id
        });
        
        res.status(201).json({
            success: true,
            data: camera
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update camera
// @route   PUT /api/cameras/:id
// @access  Private
exports.updateCamera = async (req, res) => {
    try {
        const { name, url, location, isActive } = req.body;
        
        let camera = await Camera.findById(req.params.id);
        
        if (!camera) {
            return res.status(404).json({ success: false, message: 'Camera not found' });
        }
        
        // Update camera in database
        camera = await Camera.findByIdAndUpdate(req.params.id, {
            name,
            url,
            location,
            isActive
        }, {
            new: true,
            runValidators: true
        });
        
        res.status(200).json({
            success: true,
            data: camera
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete camera
// @route   DELETE /api/cameras/:id
// @access  Private
exports.deleteCamera = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        
        if (!camera) {
            return res.status(404).json({ success: false, message: 'Camera not found' });
        }
        
        // Delete camera from database
        await Camera.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update camera connection status
// @route   PUT /api/cameras/:id/status
// @access  Private
exports.updateCameraStatus = async (req, res) => {
    try {
        const { isConnected } = req.body;
        
        let camera = await Camera.findById(req.params.id);
        
        if (!camera) {
            return res.status(404).json({ success: false, message: 'Camera not found' });
        }
        
        // Update camera status
        camera = await Camera.findByIdAndUpdate(req.params.id, {
            isConnected,
            lastConnected: isConnected ? Date.now() : camera.lastConnected
        }, {
            new: true,
            runValidators: true
        });
        
        res.status(200).json({
            success: true,
            data: camera
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
