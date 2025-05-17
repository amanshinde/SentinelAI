const Setting = require('../models/Setting');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
    try {
        // Find settings or create default if none exist
        let settings = await Setting.findOne();
        
        if (!settings) {
            settings = await Setting.create({
                notificationEmail: '',
                notificationSMS: '',
                detectionThreshold: 0.6,
                enableNotifications: true,
                notifyOnlyRestricted: false,
                updatedBy: req.user.id
            });
        }
        
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private
exports.updateSettings = async (req, res) => {
    try {
        const {
            notificationEmail,
            notificationSMS,
            detectionThreshold,
            enableNotifications,
            notifyOnlyRestricted
        } = req.body;
        
        // Find settings or create default if none exist
        let settings = await Setting.findOne();
        
        if (!settings) {
            settings = await Setting.create({
                notificationEmail,
                notificationSMS,
                detectionThreshold,
                enableNotifications,
                notifyOnlyRestricted,
                updatedBy: req.user.id
            });
        } else {
            // Update existing settings
            settings = await Setting.findOneAndUpdate({}, {
                notificationEmail,
                notificationSMS,
                detectionThreshold,
                enableNotifications,
                notifyOnlyRestricted,
                updatedBy: req.user.id,
                updatedAt: Date.now()
            }, {
                new: true,
                runValidators: true
            });
        }
        
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
