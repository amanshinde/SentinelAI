const mongoose = require('mongoose');

const DetectionSchema = new mongoose.Schema({
    face: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Face',
        required: true
    },
    camera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Camera',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    confidence: {
        type: Number,
        required: true
    },
    imagePath: {
        type: String,
        required: true
    },
    notified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Detection', DetectionSchema);
