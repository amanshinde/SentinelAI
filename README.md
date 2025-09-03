# SentinelAI - CCTV Face Recognition System

SentinelAI is a comprehensive face recognition system for CCTV surveillance, designed to detect and identify faces in real-time from webcam and camera feeds.

## Features

- **Face Management**: Upload and manage known faces with labels/names
- **Real-time Detection**: Detect and identify faces in real-time
- **Automated Alerts**: Receive notifications when faces are detected
- **Detection Logs**: Review and search through historical detection events
- **Admin-Only Access**: Secure login system with admin-only user management
- **User Management**: Admin interface for creating and managing users with different roles
- **Responsive UI**: Modern, responsive user interface with improved styling

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
sentinelai/
├── frontend/            # Frontend HTML, CSS, and JavaScript files
│   ├── src/
│   │   ├── css/         # Stylesheets
│   │   ├── js/          # JavaScript files
│   │   └── images/      # Static images
│   ├── index.html       # Landing page
│   ├── login.html       # Login page
│   ├── surveillance.html # Main surveillance dashboard
│   ├── faces.html       # Face management page
│   ├── users.html       # User management page
│   └── settings.html    # System settings page
├── models/              # MongoDB models
├── controllers/         # API controllers
├── routes/              # API routes
├── middleware/          # Express middleware
├── uploads/             # Uploaded files (faces and detections)
│   ├── faces/           # Uploaded face images
│   └── detections/      # Detection screenshots
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
└── .env                 # Environment variables
```

## Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **Webcam** (for real-time surveillance)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd facerecog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sentinelai
   JWT_SECRET=your_super_secret_jwt_key_here
   ADMIN_EMAIL=admin@sentinelai.com
   ADMIN_PASSWORD=admin123
   ADMIN_USERNAME=Administrator
   ```

4. **Download Face Recognition Models** (Optional but recommended)
   - Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   - Download all model files and place them in `models/face-api/`
   - See `models/face-api/README.md` for detailed instructions

5. **Start MongoDB**
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

6. **Start the server**
   ```bash
   npm start
   ```

7. **Access the application**
   - Open your browser and go to `http://localhost:5000`
   - Login with admin credentials from your `.env` file

**Note**: On first startup, the system automatically creates an admin user with the credentials specified in the `.env` file.

## Development

For development with hot-reloading:
```
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (admin only)
- `POST /api/auth/users` - Create a new user (admin only)
- `DELETE /api/auth/users/:id` - Delete a user (admin only)

### Faces
- `GET /api/faces` - Get all faces
- `GET /api/faces/:id` - Get a single face
- `POST /api/faces` - Add a new face
- `PUT /api/faces/:id` - Update a face
- `DELETE /api/faces/:id` - Delete a face

### Cameras
- `GET /api/cameras` - Get all cameras
- `GET /api/cameras/:id` - Get a single camera
- `POST /api/cameras` - Add a new camera
- `PUT /api/cameras/:id` - Update a camera
- `DELETE /api/cameras/:id` - Delete a camera
- `PUT /api/cameras/:id/status` - Update camera connection status
- `POST /api/cameras/webcam/start` - Start webcam surveillance
- `POST /api/cameras/webcam/stop` - Stop webcam surveillance
- `POST /api/cameras/webcam/detect` - Process webcam frame for face detection

### Detections
- `GET /api/detections` - Get all detections (with filtering)
- `GET /api/detections/:id` - Get a single detection
- `POST /api/detections` - Add a new detection
- `DELETE /api/detections/:id` - Delete a detection

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

## Usage Guide

### Getting Started
1. **Login**: Use admin credentials from your `.env` file
2. **Add Faces**: Go to "Manage Faces" to upload known faces
3. **Start Surveillance**: Click "Start Webcam" on the surveillance page
4. **Monitor Detections**: View real-time detections and alerts

### Key Features
- **Real-time Face Detection**: Uses webcam for live surveillance
- **Face Recognition**: Matches detected faces against known database
- **Detection Categories**: Employee, Visitor, Restricted access levels
- **Live Notifications**: Real-time alerts for face detections
- **Detection History**: Complete log of all detection events
- **User Management**: Admin can create and manage user accounts

### Face Recognition Modes
- **Full Mode**: With face-api.js models for accurate recognition
- **Fallback Mode**: Random encodings for testing without models

## Troubleshooting

### Common Issues
1. **Webcam not working**: Check browser permissions for camera access
2. **No face detection**: Ensure face-api.js models are downloaded
3. **MongoDB connection**: Verify MongoDB is running and accessible
4. **Port conflicts**: Change PORT in `.env` if 5000 is occupied

### Performance Tips
- Use good lighting for better face detection
- Position camera at eye level for optimal results
- Ensure stable internet connection for real-time features

## Future Enhancements

- ✅ Real-time webcam surveillance
- ✅ Face recognition and matching
- ✅ Detection notifications and alerts
- ✅ User management system
- 🔄 Integration with IP cameras
- 🔄 Mobile app integration
- 🔄 Advanced analytics dashboard
- 🔄 Multi-factor authentication
- 🔄 Email notifications for events
- 🔄 Customizable detection zones
