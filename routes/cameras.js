const express = require('express');
const { 
    getCameras, 
    getCamera, 
    createCamera, 
    updateCamera, 
    deleteCamera,
    updateCameraStatus
} = require('../controllers/cameraController');
const {
    startWebcamSurveillance,
    stopWebcamSurveillance,
    detectWebcamFrame
} = require('../controllers/webcamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getCameras)
    .post(protect, createCamera);

router.route('/:id')
    .get(protect, getCamera)
    .put(protect, updateCamera)
    .delete(protect, deleteCamera);

router.route('/:id/status')
    .put(protect, updateCameraStatus);

// Webcam routes
router.route('/webcam/start')
    .post(protect, startWebcamSurveillance);

router.route('/webcam/stop')
    .post(protect, stopWebcamSurveillance);

router.route('/webcam/detect')
    .post(protect, detectWebcamFrame);

module.exports = router;
