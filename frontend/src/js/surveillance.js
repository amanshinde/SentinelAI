document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get dashboard functions
    const { API_URL, getAuthHeaders, addNotification } = window.dashboardFunctions || {};
    
    // DOM Elements
    const systemStatus = document.querySelector('.surveillance-status');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const cameraTime = document.getElementById('camera-time');
    const startSystemBtn = document.getElementById('start-surveillance');
    const stopSystemBtn = document.getElementById('stop-surveillance');
    const webcamVideo = document.getElementById('webcam-video');
    const webcamCanvas = document.getElementById('webcam-canvas');
    const webcamPlaceholder = document.getElementById('webcam-placeholder');
    const webcamStatus = document.getElementById('webcam-status');
    
    // System state
    let systemRunning = false;
    let webcamStream = null;
    let detectionInterval = null;
    
    // Update camera time
    function updateCameraTime() {
        if (cameraTime) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            cameraTime.textContent = timeString;
        }
    }
    
    // Set interval to update camera time
    setInterval(updateCameraTime, 1000);
    updateCameraTime(); // Initial update
    
    // Update system status UI
    function updateSystemStatus(running) {
        systemRunning = running;
        
        if (statusIndicator && statusText) {
            if (running) {
                statusIndicator.className = 'status-indicator online';
                statusText.textContent = 'Online';
                statusText.className = 'status-text online';
            } else {
                statusIndicator.className = 'status-indicator offline';
                statusText.textContent = 'Offline';
                statusText.className = 'status-text offline';
            }
        }
        
        // Update buttons
        if (startSystemBtn && stopSystemBtn) {
            startSystemBtn.disabled = running;
            stopSystemBtn.disabled = !running;
        }
    }
    
    // Start surveillance system
    async function startSystem() {
        try {
            // Update UI
            updateSystemStatus(true);
            
            // Start webcam
            await startWebcam();
            
            // Add notification
            addNotification('Surveillance system started', 'success');
            
            // Start face detection (simulated for now)
            startFaceDetection();
            
        } catch (error) {
            console.error('Error starting system:', error);
            updateSystemStatus(false);
            addNotification(`Failed to start system: ${error.message}`, 'error');
        }
    }
    
    // Stop surveillance system
    function stopSystem() {
        try {
            // Update UI
            updateSystemStatus(false);
            
            // Stop webcam
            stopWebcam();
            
            // Stop face detection
            stopFaceDetection();
            
            // Add notification
            addNotification('Surveillance system stopped', 'info');
            
        } catch (error) {
            console.error('Error stopping system:', error);
            addNotification(`Error stopping system: ${error.message}`, 'error');
        }
    }
    
    // Load cameras from API
    async function loadCameras() {
        try {
            const response = await fetch(`${API_URL}/cameras`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load cameras');
            }
            
            cameras = data.data;
            
            // If no cameras found, show message
            if (cameras.length === 0) {
                addNotification('No cameras configured. Please add cameras in settings.', 'warning');
            }
            
            // Update camera feeds
            updateCameraFeeds();
            
        } catch (error) {
            console.error('Error loading cameras:', error);
            addNotification(`Failed to load cameras: ${error.message}`, 'error');
        }
    }
    
    // Start webcam
    async function startWebcam() {
        try {
            // Request webcam access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Store the stream
            webcamStream = stream;
            
            // Set up video element
            webcamVideo.srcObject = stream;
            webcamVideo.style.display = 'block';
            webcamVideo.style.width = '100%';
            webcamVideo.style.height = 'auto';
            webcamVideo.style.maxHeight = '100%';
            webcamVideo.style.borderRadius = '8px';
            webcamPlaceholder.style.display = 'none';
            
            // Ensure video starts playing
            webcamVideo.play();
            
            // Update status
            webcamStatus.textContent = 'Connected';
            
            return true;
        } catch (error) {
            console.error('Error accessing webcam:', error);
            addNotification(`Error accessing webcam: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // Stop webcam
    function stopWebcam() {
        if (webcamStream) {
            // Stop all tracks
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            
            // Hide video element and show placeholder
            webcamVideo.style.display = 'none';
            webcamVideo.srcObject = null;
            webcamPlaceholder.style.display = 'block';
            
            // Update status
            webcamStatus.textContent = 'Disconnected';
        }
    }
    
    // Update camera feeds in UI
    function updateCameraFeeds() {
        // For now, we'll just use placeholder content
        // In a real implementation, this would connect to actual camera streams
        
        cameraFeeds.forEach((feed, index) => {
            const cameraHeader = feed.querySelector('.camera-header h3');
            const cameraContent = feed.querySelector('.camera-content');
            const cameraFooter = feed.querySelector('.camera-footer');
            const cameraStatus = feed.querySelector('.camera-status');
            
            if (index === 0) {
                // Main camera - always show placeholder for now
                if (cameraHeader) {
                    cameraHeader.textContent = 'Main Camera';
                }
                
                if (cameraContent) {
                    cameraContent.innerHTML = `
                        <div class="camera-placeholder">
                            <i class="fas fa-video-slash"></i>
                            <p>Camera not connected</p>
                            <p>Click "Start System" to connect</p>
                        </div>
                    `;
                }
                
                if (cameraStatus) {
                    cameraStatus.textContent = 'Disconnected';
                }
            } else if (index < cameras.length + 1) {
                // We have a camera for this feed
                const camera = cameras[index - 1];
                
                if (cameraHeader) {
                    cameraHeader.textContent = camera.name;
                }
                
                if (cameraContent) {
                    cameraContent.innerHTML = `
                        <div class="camera-placeholder">
                            <i class="fas fa-video-slash"></i>
                            <p>Camera not connected</p>
                            <p>${camera.location || 'No location specified'}</p>
                        </div>
                    `;
                }
                
                if (cameraStatus) {
                    cameraStatus.textContent = camera.isConnected ? 'Connected' : 'Disconnected';
                }
            } else {
                // No camera for this feed
                if (cameraHeader) {
                    cameraHeader.textContent = `Camera ${index + 1}`;
                }
                
                if (cameraContent) {
                    cameraContent.innerHTML = `
                        <div class="camera-placeholder">
                            <i class="fas fa-video-slash"></i>
                            <p>No camera configured</p>
                        </div>
                    `;
                }
                
                if (cameraStatus) {
                    cameraStatus.textContent = 'Not configured';
                }
            }
        });
    }
    
    // Start face detection (simulated for now)
    function startFaceDetection() {
        // In a real implementation, this would use a face recognition library
        // For now, we'll just simulate detection with a blinking effect
        
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
        
        // Make sure webcam is ready before starting detection
        webcamVideo.addEventListener('loadeddata', function() {
            console.log('Webcam video loaded and ready for processing');
        });
        
        // Simulate detection by capturing frames from webcam to canvas
        detectionInterval = setInterval(() => {
            if (webcamStream && webcamVideo.readyState >= 2) { // At least HAVE_CURRENT_DATA
                try {
                    // Draw video frame to canvas
                    const context = webcamCanvas.getContext('2d');
                    webcamCanvas.width = webcamVideo.videoWidth;
                    webcamCanvas.height = webcamVideo.videoHeight;
                    context.drawImage(webcamVideo, 0, 0, webcamCanvas.width, webcamCanvas.height);
                    
                    // Simulate detection (random chance of detection)
                    if (Math.random() < 0.01) { // 1% chance per frame
                        // Simulate a detection
                        addNotification('Face detected in webcam feed', 'warning');
                    }
                } catch (error) {
                    console.error('Error processing webcam frame:', error);
                }
            }
        }, 500); // Check every 500ms (reduced frequency for better performance)
    }
    
    // Stop face detection
    function stopFaceDetection() {
        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }
    }
    
    // Add event listeners
    if (startSystemBtn) {
        startSystemBtn.addEventListener('click', startSystem);
    }
    
    if (stopSystemBtn) {
        stopSystemBtn.addEventListener('click', stopSystem);
    }
    
    // Fullscreen button functionality
    const fullscreenBtn = document.querySelector('.camera-control[title="Fullscreen"]');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            if (webcamVideo) {
                if (webcamVideo.requestFullscreen) {
                    webcamVideo.requestFullscreen();
                } else if (webcamVideo.webkitRequestFullscreen) { /* Safari */
                    webcamVideo.webkitRequestFullscreen();
                } else if (webcamVideo.msRequestFullscreen) { /* IE11 */
                    webcamVideo.msRequestFullscreen();
                }
            } else {
                addNotification('Webcam is not active', 'warning');
            }
        });
    }
    
    // Handle page visibility changes to stop webcam when page is hidden
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && systemRunning) {
            stopSystem();
            addNotification('Surveillance stopped due to page visibility change', 'info');
        }
    });
    
    // Initialize
    updateSystemStatus(false);
});
