const express = require('express');
const { 
    getFaces, 
    getFace, 
    createFace, 
    updateFace, 
    deleteFace 
} = require('../controllers/faceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getFaces)
    .post(protect, createFace);

router.route('/:id')
    .get(protect, getFace)
    .put(protect, updateFace)
    .delete(protect, deleteFace);

module.exports = router;
