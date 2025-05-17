# SentinelAI - CCTV Face Recognition System

SentinelAI is a comprehensive face recognition system for CCTV surveillance, designed to detect and identify faces in real-time from webcam and camera feeds.

## Features

- **Face Management**: Upload and manage known faces with labels/names
- **Webcam Integration**: Monitor webcam feed for face detection
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
- **Face Recognition**: Placeholder for integration with face_recognition library

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

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in `.env` file:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sentinelai
   JWT_SECRET=your_jwt_secret
   ADMIN_EMAIL=admin@sentinelai.com
   ADMIN_PASSWORD=admin123
   ADMIN_USERNAME=admin
   ```
4. Start the server:
   ```
   npm start
   ```

**Note**: On first startup, the system will automatically create an admin user with the credentials specified in the `.env` file.

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

### Detections
- `GET /api/detections` - Get all detections (with filtering)
- `GET /api/detections/:id` - Get a single detection
- `POST /api/detections` - Add a new detection
- `DELETE /api/detections/:id` - Delete a detection

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

## Future Enhancements

- Integration with actual face recognition model
- Advanced face detection algorithms
- Real-time video streaming from multiple sources
- Mobile app integration
- Advanced analytics dashboard
- Multi-factor authentication
- Email notifications for important events
- Customizable detection zones
