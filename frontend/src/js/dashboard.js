document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // API base URL
    const API_URL = '/api';

    // DOM Elements
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    const logoutBtn = document.getElementById('logout-btn');
    const notificationBell = document.getElementById('notification-bell');
    const notificationPanel = document.getElementById('notification-panel');
    const notificationCount = document.getElementById('notification-count');
    const notificationList = document.getElementById('notification-list');
    const clearNotificationsBtn = document.getElementById('clear-notifications');
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const closeSidebarBtn = document.querySelector('.close-sidebar');

    // Sidebar toggle functionality
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('active');
        });
    }

    // Notification panel toggle
    if (notificationBell && notificationPanel) {
        notificationBell.addEventListener('click', function() {
            notificationPanel.classList.toggle('active');
        });

        // Close notification panel when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationBell.contains(e.target) && !notificationPanel.contains(e.target)) {
                notificationPanel.classList.remove('active');
            }
        });
    }

    // Clear notifications
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', function() {
            notificationList.innerHTML = '<div class="empty-notifications">No new notifications</div>';
            notificationCount.textContent = '0';
            notificationCount.style.display = 'none';
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // Get user info
    async function getUserInfo() {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user info');
            }

            const data = await response.json();
            
            if (data.success && data.user) {
                // Store user info
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update UI
                if (userNameElement) {
                    userNameElement.textContent = data.user.username;
                }
                
                if (userRoleElement) {
                    userRoleElement.textContent = data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1);
                }
                
                // Show/hide admin-only elements
                const adminOnlyElements = document.querySelectorAll('.admin-only');
                adminOnlyElements.forEach(element => {
                    if (data.user.role === 'admin') {
                        element.style.display = '';
                    } else {
                        element.style.display = 'none';
                    }
                });
            }
        } catch (error) {
            console.error('Error getting user info:', error);
            // If unauthorized, redirect to login
            if (error.message.includes('401')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        }
    }

    // Add a notification
    function addNotification(message, type = 'info') {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        notificationItem.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
                <span class="notification-time">${timestamp}</span>
            </div>
            <button class="delete-notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Remove empty notifications message if present
        const emptyNotifications = notificationList.querySelector('.empty-notifications');
        if (emptyNotifications) {
            emptyNotifications.remove();
        }
        
        // Add to notification list
        notificationList.prepend(notificationItem);
        
        // Update notification count
        const count = notificationList.querySelectorAll('.notification-item').length;
        notificationCount.textContent = count;
        notificationCount.style.display = count > 0 ? 'flex' : 'none';
        
        // Add delete functionality
        const deleteBtn = notificationItem.querySelector('.delete-notification');
        deleteBtn.addEventListener('click', function() {
            notificationItem.remove();
            
            // Update count
            const newCount = notificationList.querySelectorAll('.notification-item').length;
            notificationCount.textContent = newCount;
            notificationCount.style.display = newCount > 0 ? 'flex' : 'none';
            
            // Show empty message if no notifications
            if (newCount === 0) {
                notificationList.innerHTML = '<div class="empty-notifications">No new notifications</div>';
            }
        });
    }

    // Initialize
    getUserInfo();

    // Export functions for use in other scripts
    window.dashboardFunctions = {
        addNotification,
        API_URL,
        getAuthHeaders: () => ({ 'Authorization': `Bearer ${token}` })
    };
});
