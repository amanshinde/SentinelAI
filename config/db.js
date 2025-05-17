const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinelai', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`Connected to MongoDB: ${conn.connection.host}`);
        
        // Check if admin user exists, if not create one
        await createAdminUser();
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// Create admin user if it doesn't exist
const createAdminUser = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@sentinelai.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminUsername = process.env.ADMIN_USERNAME || 'Administrator';

        // Check if admin user already exists
        const adminExists = await User.findOne({ email: adminEmail });
        
        if (!adminExists) {
            console.log('Creating default admin user...');
            
            // Create admin user
            await User.create({
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            
            console.log(`Default admin user created: ${adminEmail}`);
            console.log('Please change the default password immediately!');
        }
    } catch (error) {
        console.error(`Error creating admin user: ${error.message}`);
    }
};

module.exports = connectDB;
