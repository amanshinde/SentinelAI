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
    const usersTableBody = document.getElementById('users-table-body');
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-modal');
    const addUserForm = document.getElementById('add-user-form');
    const searchInput = document.getElementById('search-users');
    
    // Check if user is admin
    const checkAdminAccess = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get user info');
            }
            
            if (data.user.role !== 'admin') {
                // Redirect non-admin users
                window.location.href = 'surveillance.html';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking admin access:', error);
            window.location.href = 'login.html';
            return false;
        }
    };

    // Show add user modal
    if (addUserBtn && addUserModal) {
        addUserBtn.addEventListener('click', function() {
            addUserModal.classList.add('active');
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
                
                // Reset form if it's the add user modal
                if (modal.id === 'add-user-modal' && addUserForm) {
                    addUserForm.reset();
                }
            });
        });
    }

    // Add user form submission
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usernameInput = document.getElementById('user-username');
            const emailInput = document.getElementById('user-email');
            const passwordInput = document.getElementById('user-password');
            const roleInput = document.getElementById('user-role');
            const submitBtn = addUserForm.querySelector('button[type="submit"]');
            
            // Validate inputs
            if (!usernameInput.value.trim()) {
                alert('Please enter a username');
                return;
            }
            
            if (!emailInput.value.trim()) {
                alert('Please enter an email');
                return;
            }
            
            if (!passwordInput.value.trim()) {
                alert('Please enter a password');
                return;
            }
            
            try {
                // Disable submit button and show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
                
                // Send request to API
                const response = await fetch(`${API_URL}/auth/users`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: usernameInput.value.trim(),
                        email: emailInput.value.trim(),
                        password: passwordInput.value.trim(),
                        role: roleInput.value
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to add user');
                }
                
                // Success
                addNotification(`User "${usernameInput.value.trim()}" added successfully`, 'success');
                
                // Close modal and reset form
                addUserModal.classList.remove('active');
                addUserForm.reset();
                
                // Reload users
                loadUsers();
                
            } catch (error) {
                console.error('Error adding user:', error);
                alert(error.message || 'Failed to add user. Please try again.');
            } finally {
                // Reset submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Add User';
            }
        });
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            const rows = usersTableBody.querySelectorAll('tr');
            
            rows.forEach(row => {
                if (row.querySelector('td.empty-cell') || row.querySelector('td.loading-cell') || row.querySelector('td.error-cell')) {
                    return;
                }
                
                const username = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
                const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const role = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                
                if (username.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Load users from API
    async function loadUsers() {
        try {
            usersTableBody.innerHTML = '<tr><td colspan="5" class="loading-cell"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading users...</p></div></td></tr>';
            
            const response = await fetch(`${API_URL}/auth/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load users');
            }
            
            // Clear loading message
            usersTableBody.innerHTML = '';
            
            if (data.data.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="5" class="empty-cell"><div class="empty-state"><i class="fas fa-users-slash"></i><p>No users found</p><p>Click "Add New User" to create a user</p></div></td></tr>';
                return;
            }
            
            // Render users
            data.data.forEach(user => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(user.createdAt);
                const dateString = date.toLocaleDateString();
                
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="user-role ${user.role.toLowerCase()}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
                    <td>${dateString}</td>
                    <td>
                        <div class="user-actions">
                            <button class="user-action delete-user" data-id="${user._id}" title="Delete" ${user._id === JSON.parse(localStorage.getItem('user'))._id ? 'disabled' : ''}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                usersTableBody.appendChild(row);
                
                // Add event listener for delete button
                const deleteBtn = row.querySelector('.delete-user');
                if (deleteBtn && !deleteBtn.disabled) {
                    deleteBtn.addEventListener('click', () => deleteUser(user._id, user.username));
                }
            });
            
        } catch (error) {
            console.error('Error loading users:', error);
            usersTableBody.innerHTML = `<tr><td colspan="5" class="error-cell"><div class="error-state"><i class="fas fa-exclamation-circle"></i><p>Error loading users</p><p>${error.message}</p></div></td></tr>`;
        }
    }

    // Delete user
    async function deleteUser(id, username) {
        if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete user');
            }
            
            // Success
            addNotification(`User "${username}" deleted successfully`, 'success');
            
            // Reload users
            loadUsers();
            
        } catch (error) {
            console.error('Error deleting user:', error);
            addNotification(error.message || 'Failed to delete user', 'error');
        }
    }

    // Initialize
    async function init() {
        const isAdmin = await checkAdminAccess();
        if (isAdmin) {
            loadUsers();
        }
    }
    
    init();
});