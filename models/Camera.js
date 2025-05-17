const mongoose = require('mongoose');

const CameraSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a camera name'],
        trim: true
    },
    url: {
        type: String,
        required: [true, 'Please provide a camera URL/stream address']
    },
    location: {
        type: String,
        default: 'Unknown'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    lastConnected: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Camera', CameraSchema);
