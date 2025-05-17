const mongoose = require('mongoose');

const FaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this face'],
        trim: true
    },
    category: {
        type: String,
        enum: ['employee', 'visitor', 'restricted'],
        default: 'visitor'
    },
    imagePath: {
        type: String,
        required: [true, 'Face image path is required']
    },
    notes: {
        type: String,
        default: ''
    },
    encodings: {
        type: [Number],
        required: [true, 'Face encodings are required']
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

module.exports = mongoose.model('Face', FaceSchema);
