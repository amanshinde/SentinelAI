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
    const settingsForm = document.getElementById('settings-form');
    const notificationEmailInput = document.getElementById('notification-email');
    const notificationSMSInput = document.getElementById('notification-sms');
    const detectionThresholdInput = document.getElementById('detection-threshold');
    const thresholdValue = document.getElementById('threshold-value');
    const enableNotificationsCheckbox = document.getElementById('enable-notifications');
    const notifyRestrictedOnlyCheckbox = document.getElementById('notify-restricted-only');
    const addCameraBtn = document.getElementById('add-camera-btn');
    const camerasList = document.getElementById('cameras-list');
    const addCameraModal = document.getElementById('add-camera-modal');
    const addCameraForm = document.getElementById('add-camera-form');
    const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-modal');
    
    // Update threshold value display
    if (detectionThresholdInput && thresholdValue) {
        detectionThresholdInput.addEventListener('input', function() {
            thresholdValue.textContent = `${this.value}%`;
        });
    }
    
    // Show add camera modal
    if (addCameraBtn && addCameraModal) {
        addCameraBtn.addEventListener('click', function() {
            addCameraModal.classList.add('active');
        });
    }
    
    // Close modals
    if (closeModalBtns.length > 0) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
                
                // Reset form if it's the add camera modal
                if (modal.id === 'add-camera-modal' && addCameraForm) {
                    addCameraForm.reset();
                }
            });
        });
    }
    
    // Load settings
    async function loadSettings() {
        try {
            const response = await fetch(`${API_URL}/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load settings');
            }
            
            const settings = data.data;
            
            // Update form inputs
            if (notificationEmailInput) {
                notificationEmailInput.value = settings.notificationEmail || '';
            }
            
            if (notificationSMSInput) {
                notificationSMSInput.value = settings.notificationSMS || '';
            }
            
            if (detectionThresholdInput) {
                const thresholdPercent = Math.round(settings.detectionThreshold * 100);
                detectionThresholdInput.value = thresholdPercent;
                if (thresholdValue) {
                    thresholdValue.textContent = `${thresholdPercent}%`;
                }
            }
            
            if (enableNotificationsCheckbox) {
                enableNotificationsCheckbox.checked = settings.enableNotifications;
            }
            
            if (notifyRestrictedOnlyCheckbox) {
                notifyRestrictedOnlyCheckbox.checked = settings.notifyOnlyRestricted;
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            addNotification(`Failed to load settings: ${error.message}`, 'error');
        }
    }
    
    // Load cameras
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
            
            // Clear existing cameras
            if (camerasList) {
                camerasList.innerHTML = '';
                
                if (data.data.length === 0) {
                    camerasList.innerHTML = '<div class="empty-state"><p>No cameras added yet</p><p>Click "Add Camera" to get started</p></div>';
                    return;
                }
                
                // Render cameras
                data.data.forEach(camera => {
                    const cameraItem = document.createElement('div');
                    cameraItem.className = 'camera-item';
                    cameraItem.dataset.id = camera._id;
                    
                    cameraItem.innerHTML = `
                        <div class="camera-info">
                            <h3>${camera.name}</h3>
                            <p class="camera-url">${camera.url}</p>
                            <p class="camera-location">${camera.location || 'No location specified'}</p>
                        </div>
                        <div class="camera-status">
                            <span class="status-indicator ${camera.isConnected ? 'online' : 'offline'}"></span>
                            <span class="status-text">${camera.isConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                        <div class="camera-actions">
                            <label class="switch">
                                <input type="checkbox" class="camera-active-toggle" ${camera.isActive ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                            <button class="btn-icon edit-camera" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete-camera" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    camerasList.appendChild(cameraItem);
                    
                    // Add event listeners
                    const activeToggle = cameraItem.querySelector('.camera-active-toggle');
                    const editBtn = cameraItem.querySelector('.edit-camera');
                    const deleteBtn = cameraItem.querySelector('.delete-camera');
                    
                    if (activeToggle) {
                        activeToggle.addEventListener('change', () => toggleCameraActive(camera._id, activeToggle.checked));
                    }
                    
                    if (editBtn) {
                        editBtn.addEventListener('click', () => editCamera(camera));
                    }
                    
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => deleteCamera(camera._id, camera.name));
                    }
                });
            }
            
        } catch (error) {
            console.error('Error loading cameras:', error);
            if (camerasList) {
                camerasList.innerHTML = `<div class="error-state"><p>Failed to load cameras</p><p>${error.message}</p></div>`;
            }
        }
    }
    
    // Toggle camera active state
    async function toggleCameraActive(id, isActive) {
        try {
            const response = await fetch(`${API_URL}/cameras/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update camera');
            }
            
            // Success
            addNotification(`Camera ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
            
        } catch (error) {
            console.error('Error updating camera:', error);
            addNotification(`Failed to update camera: ${error.message}`, 'error');
            
            // Reset toggle
            const cameraItem = document.querySelector(`.camera-item[data-id="${id}"]`);
            if (cameraItem) {
                const toggle = cameraItem.querySelector('.camera-active-toggle');
                if (toggle) {
                    toggle.checked = !isActive;
                }
            }
        }
    }
    
    // Edit camera
    function editCamera(camera) {
        // For now, just show a notification
        addNotification('Edit camera functionality will be implemented soon', 'info');
    }
    
    // Delete camera
    async function deleteCamera(id, name) {
        if (!confirm(`Are you sure you want to delete camera "${name}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/cameras/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete camera');
            }
            
            // Success
            addNotification(`Camera "${name}" deleted successfully`, 'success');
            
            // Reload cameras
            loadCameras();
            
        } catch (error) {
            console.error('Error deleting camera:', error);
            addNotification(`Failed to delete camera: ${error.message}`, 'error');
        }
    }
    
    // Save settings
    if (settingsForm) {
        settingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const notificationEmail = notificationEmailInput ? notificationEmailInput.value.trim() : '';
                const notificationSMS = notificationSMSInput ? notificationSMSInput.value.trim() : '';
                const detectionThreshold = detectionThresholdInput ? parseFloat(detectionThresholdInput.value) / 100 : 0.6;
                const enableNotifications = enableNotificationsCheckbox ? enableNotificationsCheckbox.checked : true;
                const notifyOnlyRestricted = notifyRestrictedOnlyCheckbox ? notifyRestrictedOnlyCheckbox.checked : false;
                
                // Validate email if provided
                if (notificationEmail && !isValidEmail(notificationEmail)) {
                    throw new Error('Please enter a valid email address');
                }
                
                // Send request to API
                const response = await fetch(`${API_URL}/settings`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        notificationEmail,
                        notificationSMS,
                        detectionThreshold,
                        enableNotifications,
                        notifyOnlyRestricted
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to save settings');
                }
                
                // Success
                addNotification('Settings saved successfully', 'success');
                
            } catch (error) {
                console.error('Error saving settings:', error);
                addNotification(`Failed to save settings: ${error.message}`, 'error');
            }
        });
    }
    
    // Add camera form submission
    if (addCameraForm) {
        addCameraForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('camera-name');
            const urlInput = document.getElementById('camera-url');
            const locationInput = document.getElementById('camera-location');
            const submitBtn = addCameraForm.querySelector('button[type="submit"]');
            
            // Validate inputs
            if (!nameInput.value.trim()) {
                alert('Please enter a camera name');
                return;
            }
            
            if (!urlInput.value.trim()) {
                alert('Please enter a camera URL');
                return;
            }
            
            try {
                // Disable submit button and show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
                
                // Send request to API
                const response = await fetch(`${API_URL}/cameras`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: nameInput.value.trim(),
                        url: urlInput.value.trim(),
                        location: locationInput.value.trim()
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to add camera');
                }
                
                // Success
                addNotification(`Camera "${data.data.name}" added successfully`, 'success');
                
                // Close modal and reset form
                addCameraModal.classList.remove('active');
                addCameraForm.reset();
                
                // Reload cameras
                loadCameras();
                
            } catch (error) {
                console.error('Error adding camera:', error);
                alert(error.message || 'Failed to add camera. Please try again.');
            } finally {
                // Reset submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Add Camera';
            }
        });
    }
    
    // Helper function to validate email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Initialize
    loadSettings();
    loadCameras();
});
