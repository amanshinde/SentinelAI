document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const loginMessage = document.getElementById('loginMessage');
    const togglePassword = document.querySelector('.toggle-password');
    const loginButton = document.querySelector('button[type="submit"]');

    // API base URL
    const API_URL = '/api';

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset error messages
            emailError.textContent = '';
            passwordError.textContent = '';
            loginMessage.textContent = '';
            loginMessage.className = 'login-message';
            
            // Get input values
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Validate inputs
            let isValid = true;
            
            if (!email) {
                emailError.textContent = 'Email is required';
                isValid = false;
            } else if (!isValidEmail(email)) {
                emailError.textContent = 'Please enter a valid email address';
                isValid = false;
            }
            
            if (!password) {
                passwordError.textContent = 'Password is required';
                isValid = false;
            }
            
            if (isValid) {
                try {
                    // Disable login button and show loading state
                    loginButton.disabled = true;
                    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                    
                    // Attempt to login using the API
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'Login failed');
                    }
                    
                    // Successful login
                    loginMessage.textContent = 'Login successful! Redirecting...';
                    loginMessage.className = 'login-message success';
                    
                    // Store token and user info
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Remember me functionality
                    const rememberMe = document.getElementById('remember').checked;
                    if (rememberMe) {
                        localStorage.setItem('rememberedUser', email);
                    } else {
                        localStorage.removeItem('rememberedUser');
                    }
                    
                    // Redirect to surveillance page after a short delay
                    setTimeout(function() {
                        window.location.href = 'surveillance.html';
                    }, 1500);
                } catch (error) {
                    // Failed login
                    loginMessage.textContent = error.message || 'Invalid email or password';
                    loginMessage.className = 'login-message error';
                    passwordInput.value = '';
                    
                    // Reset login button
                    loginButton.disabled = false;
                    loginButton.innerHTML = 'Login';
                }
            }
        });
    }
    
    // Check if there's a remembered user
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        emailInput.value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
    
    // Check if user is already logged in
    if (localStorage.getItem('token')) {
        window.location.href = 'surveillance.html';
    }
    
    // Helper function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});
