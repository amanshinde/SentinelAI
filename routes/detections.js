const express = require('express');
const { 
    getDetections, 
    getDetection, 
    createDetection, 
    deleteDetection 
} = require('../controllers/detectionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getDetections)
    .post(protect, createDetection);

router.route('/:id')
    .get(protect, getDetection)
    .delete(protect, deleteDetection);

module.exports = router;
