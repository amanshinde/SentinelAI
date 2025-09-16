document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get dashboard functions
    const { API_URL, getAuthHeaders, addNotification } = window.dashboardFunctions || {};
    
    // Debug: Check if dashboard functions are available
    if (!window.dashboardFunctions) {
        console.error('Dashboard functions not available - dashboard.js may not be loaded');
    }
    
    // DOM Elements
    const logsTableBody = document.getElementById('logs-table-body');
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');
    const cameraFilterInput = document.getElementById('camera-filter');
    const categoryFilterInput = document.getElementById('category-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const exportLogsBtn = document.getElementById('export-logs');
    const logDetailsModal = document.getElementById('log-details-modal');
    
    // Set default date range (today only to catch recent detections)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (document.getElementById('date-from')) {
        document.getElementById('date-from').value = todayStr;
    }
    if (document.getElementById('date-to')) {
        document.getElementById('date-to').value = todayStr;
    }
    
    console.log('Default date range set to today:', todayStr);
    
    // Load cameras for filter dropdown
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
            
            // Populate camera filter dropdown
            if (cameraFilterInput && data.data.length > 0) {
                // Clear existing options except "All Cameras"
                const allCamerasOption = cameraFilterInput.querySelector('option[value="all"]');
                cameraFilterInput.innerHTML = '';
                cameraFilterInput.appendChild(allCamerasOption);
                
                // Add camera options
                data.data.forEach(camera => {
                    const option = document.createElement('option');
                    option.value = camera._id;
                    option.textContent = camera.name;
                    cameraFilterInput.appendChild(option);
                });
            }
            
        } catch (error) {
            console.error('Error loading cameras:', error);
            addNotification(`Failed to load cameras: ${error.message}`, 'error');
        }
    }
    
    // Load detection logs
    async function loadLogs(filters = {}) {
        try {
            // Show loading state
            logsTableBody.innerHTML = '<tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading logs...</td></tr>';
            
            // Build query string from filters
            let queryParams = new URLSearchParams();
            
            if (filters.startDate) {
                queryParams.append('startDate', filters.startDate);
            }
            
            if (filters.endDate) {
                queryParams.append('endDate', filters.endDate);
            }
            
            if (filters.camera && filters.camera !== 'all') {
                queryParams.append('camera', filters.camera);
            }
            
            if (filters.category && filters.category !== 'all') {
                queryParams.append('category', filters.category);
            }
            
            // Add pagination
            queryParams.append('page', filters.page || 1);
            queryParams.append('limit', filters.limit || 10);
            
            // Make API request
            const apiUrl = API_URL || '/api';
            console.log('Loading detection logs from:', `${apiUrl}/detections?${queryParams.toString()}`);
            
            const response = await fetch(`${apiUrl}/detections?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            console.log('Detection logs response:', { status: response.status, count: data.data?.length, data });
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load detection logs');
            }
            
            // Clear loading state
            logsTableBody.innerHTML = '';
            
            // Check if no logs found
            if (!data.data || data.data.length === 0) {
                logsTableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No detection logs found for the selected period</td></tr>';
                console.log('No detection logs found');
                return;
            }
            
            console.log(`Rendering ${data.data.length} detection logs`);
            
            // Render logs
            data.data.forEach(log => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(log.timestamp);
                const dateString = date.toLocaleDateString();
                const timeString = date.toLocaleTimeString();
                
                row.innerHTML = `
                    <td>${dateString} ${timeString}</td>
                    <td>${log.face ? log.face.name : 'Unknown'}</td>
                    <td>
                        <span class="category-badge ${log.face ? log.face.category.toLowerCase() : 'unknown'}">
                            ${log.face ? log.face.category : 'Unknown'}
                        </span>
                    </td>
                    <td>${log.camera ? log.camera.name : 'Unknown'}</td>
                    <td>
                        <div class="log-image-thumbnail">
                            <img src="${log.imagePath}" alt="Detection">
                        </div>
                    </td>
                    <td>
                        <button class="btn-icon view-log" data-id="${log._id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon delete-log" data-id="${log._id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                logsTableBody.appendChild(row);
                
                // Add event listeners
                const viewBtn = row.querySelector('.view-log');
                const deleteBtn = row.querySelector('.delete-log');
                
                viewBtn.addEventListener('click', () => viewLogDetails(log._id));
                deleteBtn.addEventListener('click', () => deleteLog(log._id));
            });
            
        } catch (error) {
            console.error('Error loading logs:', error);
            logsTableBody.innerHTML = `<tr><td colspan="6" class="error-cell"><i class="fas fa-exclamation-circle"></i> ${error.message}</td></tr>`;
        }
    }
    
    // View log details
    async function viewLogDetails(id) {
        try {
            // Show loading state in modal
            const logDetailPerson = document.getElementById('log-detail-person');
            const logDetailCategory = document.getElementById('log-detail-category');
            const logDetailDatetime = document.getElementById('log-detail-datetime');
            const logDetailCamera = document.getElementById('log-detail-camera');
            const logDetailConfidence = document.getElementById('log-detail-confidence');
            const logDetailImage = document.getElementById('log-detail-image');
            
            if (logDetailPerson) logDetailPerson.textContent = 'Loading...';
            if (logDetailCategory) logDetailCategory.textContent = 'Loading...';
            if (logDetailDatetime) logDetailDatetime.textContent = 'Loading...';
            if (logDetailCamera) logDetailCamera.textContent = 'Loading...';
            if (logDetailConfidence) logDetailConfidence.textContent = 'Loading...';
            if (logDetailImage) logDetailImage.src = '';
            
            // Show modal
            logDetailsModal.classList.add('active');
            
            // Fetch log details
            const response = await fetch(`${API_URL}/detections/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load log details');
            }
            
            const log = data.data;
            
            // Format date
            const date = new Date(log.timestamp);
            const dateString = date.toLocaleDateString();
            const timeString = date.toLocaleTimeString();
            
            // Update modal content
            if (logDetailPerson) logDetailPerson.textContent = log.face ? log.face.name : 'Unknown';
            if (logDetailCategory) logDetailCategory.textContent = log.face ? log.face.category : 'Unknown';
            if (logDetailDatetime) logDetailDatetime.textContent = `${dateString} ${timeString}`;
            if (logDetailCamera) logDetailCamera.textContent = log.camera ? log.camera.name : 'Unknown';
            if (logDetailConfidence) logDetailConfidence.textContent = `${(log.confidence * 100).toFixed(2)}%`;
            if (logDetailImage) logDetailImage.src = log.imagePath;
            
            // Add download functionality
            const downloadBtn = document.getElementById('download-log-image');
            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = log.imagePath;
                    a.download = `detection_${id}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
            }
            
        } catch (error) {
            console.error('Error loading log details:', error);
            addNotification(`Failed to load log details: ${error.message}`, 'error');
            
            // Close modal
            logDetailsModal.classList.remove('active');
        }
    }
    
    // Delete log
    async function deleteLog(id) {
        if (!confirm('Are you sure you want to delete this detection log?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/detections/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete log');
            }
            
            // Success
            addNotification('Detection log deleted successfully', 'success');
            
            // Reload logs
            const filters = getFilters();
            loadLogs(filters);
            
        } catch (error) {
            console.error('Error deleting log:', error);
            addNotification(`Failed to delete log: ${error.message}`, 'error');
        }
    }
    
    // Get current filters
    function getFilters() {
        // Get filters from form
        const filters = {
            startDate: document.getElementById('date-from')?.value || todayStr,
            endDate: document.getElementById('date-to')?.value || todayStr,
            camera: document.getElementById('camera-filter')?.value,
            category: document.getElementById('category-filter')?.value,
            page: 1,
            limit: 10
        };
        
        console.log('Filters being used:', filters);
        return filters;
    }
    
    // Apply filters
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            const filters = getFilters();
            loadLogs(filters);
        });
    }
    
    // Export logs
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', function() {
            // For now, just show a notification
            addNotification('Export functionality will be implemented soon', 'info');
        });
    }
    
    // Close modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn && logDetailsModal) {
        closeModalBtn.addEventListener('click', function() {
            logDetailsModal.classList.remove('active');
        });
    }
    
    // Initialize
    loadCameras();
    loadLogs(getFilters());
});
