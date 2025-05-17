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
    const facesGrid = document.getElementById('faces-grid');
    const addFaceBtn = document.getElementById('add-face-btn');
    const addFaceModal = document.getElementById('add-face-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-modal');
    const addFaceForm = document.getElementById('add-face-form');
    const fileInput = document.getElementById('face-image');
    const filePreview = document.getElementById('file-preview');
    const searchInput = document.getElementById('search-faces');

    // Show add face modal
    if (addFaceBtn && addFaceModal) {
        addFaceBtn.addEventListener('click', function() {
            addFaceModal.classList.add('active');
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
                
                // Reset form if it's the add face modal
                if (modal.id === 'add-face-modal' && addFaceForm) {
                    addFaceForm.reset();
                    filePreview.innerHTML = '';
                }
            });
        });
    }

    // File input preview
    if (fileInput && filePreview) {
        fileInput.addEventListener('change', function() {
            filePreview.innerHTML = '';
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'file-preview-image';
                    filePreview.appendChild(img);
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Add face form submission
    if (addFaceForm) {
        addFaceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('face-name');
            const categoryInput = document.getElementById('face-category');
            const notesInput = document.getElementById('face-notes');
            const submitBtn = addFaceForm.querySelector('button[type="submit"]');
            
            // Validate inputs
            if (!nameInput.value.trim()) {
                alert('Please enter a name');
                return;
            }
            
            if (!fileInput.files || !fileInput.files[0]) {
                alert('Please select an image');
                return;
            }
            
            try {
                // Disable submit button and show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
                
                // Create form data
                const formData = new FormData();
                formData.append('name', nameInput.value.trim());
                formData.append('category', categoryInput.value);
                formData.append('notes', notesInput.value.trim());
                formData.append('image', fileInput.files[0]);
                
                // Send request to API
                const response = await fetch(`${API_URL}/faces`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to add face');
                }
                
                // Success
                addNotification(`Face "${data.data.name}" added successfully`, 'success');
                
                // Close modal and reset form
                addFaceModal.classList.remove('active');
                addFaceForm.reset();
                filePreview.innerHTML = '';
                
                // Refresh faces grid
                loadFaces();
                
            } catch (error) {
                console.error('Error adding face:', error);
                alert(error.message || 'Failed to add face. Please try again.');
            } finally {
                // Reset submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Add Face';
            }
        });
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            const faceCards = facesGrid.querySelectorAll('.face-card');
            
            faceCards.forEach(card => {
                const name = card.querySelector('.face-name').textContent.toLowerCase();
                const category = card.querySelector('.face-category').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || category.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Load faces from API
    async function loadFaces() {
        try {
            facesGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading faces...</div>';
            
            const response = await fetch(`${API_URL}/faces`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load faces');
            }
            
            // Clear loading message
            facesGrid.innerHTML = '';
            
            if (data.data.length === 0) {
                facesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-user-slash"></i><p>No faces added yet</p><p>Click "Add New Face" to get started</p></div>';
                return;
            }
            
            // Render faces
            data.data.forEach(face => {
                const faceCard = document.createElement('div');
                faceCard.className = 'face-card';
                faceCard.dataset.id = face._id;
                
                const categoryClass = face.category.toLowerCase();
                
                // Ensure image path has correct format
                const imagePath = face.imagePath.startsWith('/') ? face.imagePath : `/${face.imagePath}`;
                
                faceCard.innerHTML = `
                    <div class="face-image">
                        <img src="${imagePath}" alt="${face.name}">
                        <span class="face-category ${categoryClass}">${face.category}</span>
                    </div>
                    <div class="face-info">
                        <h3 class="face-name">${face.name}</h3>
                        <p class="face-date">Added: ${new Date(face.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="face-actions">
                        <button class="btn btn-danger delete-face" title="Delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                
                facesGrid.appendChild(faceCard);
                
                // Add event listener for delete button
                const deleteBtn = faceCard.querySelector('.delete-face');
                deleteBtn.addEventListener('click', () => deleteFace(face._id, face.name));
            });
            
        } catch (error) {
            console.error('Error loading faces:', error);
            facesGrid.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load faces</p><p>${error.message}</p></div>`;
        }
    }

    // Edit face function (to be implemented)
    function editFace(id) {
        // This would open an edit modal and populate it with the face data
        // For now, just show a notification
        addNotification(`Edit functionality will be implemented soon`, 'info');
    }

    // Delete face function
    async function deleteFace(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }
        
        try {
            // Disable all delete buttons to prevent multiple clicks
            const deleteButtons = document.querySelectorAll('.delete-face');
            deleteButtons.forEach(btn => btn.disabled = true);
            
            const response = await fetch(`${API_URL}/faces/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete face');
            }
            
            // Success
            addNotification(`Face "${name}" deleted successfully`, 'success');
            
            // Remove face card from grid
            const faceCard = facesGrid.querySelector(`.face-card[data-id="${id}"]`);
            if (faceCard) {
                faceCard.remove();
            }
            
            // Show empty state if no faces left
            if (facesGrid.querySelectorAll('.face-card').length === 0) {
                facesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-user-slash"></i><p>No faces added yet</p><p>Click "Add New Face" to get started</p></div>';
            }
            
        } catch (error) {
            console.error('Error deleting face:', error);
            addNotification(error.message || 'Failed to delete face', 'error');
        } finally {
            // Re-enable delete buttons
            const deleteButtons = document.querySelectorAll('.delete-face');
            deleteButtons.forEach(btn => btn.disabled = false);
        }
    }

    // Initialize
    loadFaces();
});
