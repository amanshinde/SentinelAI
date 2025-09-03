class WebcamSurveillance {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.isActive = false;
        this.detectionInterval = null;
        this.detectionFrequency = 2000; // Check every 2 seconds
        this.token = localStorage.getItem('token');
    }

    async initialize() {
        this.video = document.getElementById('webcam-video');
        this.canvas = document.getElementById('detection-canvas');
        this.context = this.canvas.getContext('2d');
        
        // Set up event listeners
        document.getElementById('start-webcam').addEventListener('click', () => this.startSurveillance());
        document.getElementById('stop-webcam').addEventListener('click', () => this.stopSurveillance());
        
        // Initialize detection display
        this.updateDetectionDisplay([]);
    }

    async startSurveillance() {
        try {
            // Start webcam stream
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            this.video.srcObject = this.stream;
            this.video.play();
            
            // Notify backend
            const response = await fetch('/api/cameras/webcam/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.isActive = true;
                this.updateUI(true);
                this.startDetection();
                this.showNotification('Webcam surveillance started', 'success');
            } else {
                throw new Error('Failed to start surveillance');
            }
            
        } catch (error) {
            console.error('Error starting webcam:', error);
            this.showNotification('Failed to start webcam: ' + error.message, 'error');
        }
    }

    async stopSurveillance() {
        try {
            // Stop webcam stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            // Stop detection
            if (this.detectionInterval) {
                clearInterval(this.detectionInterval);
                this.detectionInterval = null;
            }
            
            // Notify backend
            await fetch('/api/cameras/webcam/stop', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            this.isActive = false;
            this.updateUI(false);
            this.showNotification('Webcam surveillance stopped', 'info');
            
        } catch (error) {
            console.error('Error stopping webcam:', error);
            this.showNotification('Error stopping surveillance', 'error');
        }
    }

    startDetection() {
        this.detectionInterval = setInterval(async () => {
            if (this.isActive && this.video.readyState === 4) {
                await this.captureAndAnalyze();
            }
        }, this.detectionFrequency);
    }

    async captureAndAnalyze() {
        try {
            // Draw video frame to canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.context.drawImage(this.video, 0, 0);
            
            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
            
            // Send frame for analysis
            const formData = new FormData();
            formData.append('frame', blob, 'frame.jpg');
            
            const response = await fetch('/api/cameras/webcam/detect', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                this.handleDetectionResult(result);
            }
            
        } catch (error) {
            console.error('Detection error:', error);
        }
    }

    handleDetectionResult(result) {
        if (result.success && result.detections.length > 0) {
            // Update detection display
            this.updateDetectionDisplay(result.detections);
            
            // Show notifications for new detections
            result.detections.forEach(detection => {
                const person = detection.match.name;
                const category = detection.match.category;
                const confidence = (detection.match.confidence * 100).toFixed(1);
                
                this.showNotification(
                    `${category.toUpperCase()}: ${person} detected (${confidence}% confidence)`,
                    category === 'restricted' ? 'error' : 'success'
                );
            });
            
            // Draw detection boxes on canvas overlay
            this.drawDetectionBoxes(result.detections);
        }
    }

    drawDetectionBoxes(detections) {
        const overlay = document.getElementById('detection-overlay');
        const overlayContext = overlay.getContext('2d');
        
        // Clear previous boxes
        overlayContext.clearRect(0, 0, overlay.width, overlay.height);
        
        // Set canvas size to match video
        overlay.width = this.video.videoWidth;
        overlay.height = this.video.videoHeight;
        
        detections.forEach(detection => {
            const box = detection.box;
            const match = detection.match;
            
            // Set box color based on category
            const color = match.category === 'restricted' ? '#ff4444' : 
                         match.category === 'employee' ? '#44ff44' : '#ffaa44';
            
            // Draw bounding box
            overlayContext.strokeStyle = color;
            overlayContext.lineWidth = 3;
            overlayContext.strokeRect(box.x, box.y, box.width, box.height);
            
            // Draw label background
            const label = `${match.name} (${(match.confidence * 100).toFixed(1)}%)`;
            overlayContext.font = '16px Arial';
            const textWidth = overlayContext.measureText(label).width;
            
            overlayContext.fillStyle = color;
            overlayContext.fillRect(box.x, box.y - 25, textWidth + 10, 25);
            
            // Draw label text
            overlayContext.fillStyle = 'white';
            overlayContext.fillText(label, box.x + 5, box.y - 5);
        });
    }

    updateDetectionDisplay(detections) {
        const container = document.getElementById('recent-detections');
        
        if (detections.length === 0) {
            container.innerHTML = '<p class="no-detections">No recent detections</p>';
            return;
        }
        
        const detectionsHTML = detections.map(detection => {
            const match = detection.match;
            const time = new Date().toLocaleTimeString();
            const categoryClass = match.category === 'restricted' ? 'restricted' : 
                                 match.category === 'employee' ? 'employee' : 'visitor';
            
            return `
                <div class="detection-item ${categoryClass}">
                    <div class="detection-info">
                        <span class="person-name">${match.name}</span>
                        <span class="category">${match.category.toUpperCase()}</span>
                        <span class="confidence">${(match.confidence * 100).toFixed(1)}%</span>
                        <span class="time">${time}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = detectionsHTML;
    }

    updateUI(isActive) {
        const startBtn = document.getElementById('start-webcam');
        const stopBtn = document.getElementById('stop-webcam');
        const status = document.getElementById('surveillance-status');
        const webcamStatus = document.getElementById('webcam-status');
        const placeholder = document.getElementById('webcam-placeholder');
        const video = document.getElementById('webcam-video');
        
        if (isActive) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            status.textContent = 'ACTIVE';
            status.className = 'status active';
            
            // Update camera footer status
            if (webcamStatus) {
                webcamStatus.textContent = 'Connected';
                webcamStatus.style.color = '#10b981';
            }
            
            // Show video, hide placeholder
            if (placeholder) placeholder.style.display = 'none';
            if (video) video.style.display = 'block';
            
            // Start time counter
            this.startTimeCounter();
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            status.textContent = 'INACTIVE';
            status.className = 'status inactive';
            
            // Update camera footer status
            if (webcamStatus) {
                webcamStatus.textContent = 'Disconnected';
                webcamStatus.style.color = '#ef4444';
            }
            
            // Hide video, show placeholder
            if (video) video.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            
            // Stop time counter
            this.stopTimeCounter();
        }
    }

    startTimeCounter() {
        const timeElement = document.getElementById('camera-time');
        if (!timeElement) return;
        
        this.startTime = Date.now();
        this.timeInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            timeElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimeCounter() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        
        const timeElement = document.getElementById('camera-time');
        if (timeElement) {
            timeElement.textContent = '00:00:00';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize webcam surveillance when page loads
document.addEventListener('DOMContentLoaded', () => {
    const webcam = new WebcamSurveillance();
    webcam.initialize();
});
