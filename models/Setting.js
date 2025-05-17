const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    notificationEmail: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    notificationSMS: {
        type: String,
        default: ''
    },
    detectionThreshold: {
        type: Number,
        default: 0.6,
        min: 0.1,
        max: 1.0
    },
    enableNotifications: {
        type: Boolean,
        default: true
    },
    notifyOnlyRestricted: {
        type: Boolean,
        default: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Setting', SettingSchema);
