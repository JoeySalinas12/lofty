// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const loginTabBtn = document.getElementById('login-tab-btn');
    const signupTabBtn = document.getElementById('signup-tab-btn');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    
    // Login form
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    const signupName = document.getElementById('signup-name');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    const signupError = document.getElementById('signup-error');
    
    // Tab switching logic
    loginTabBtn.addEventListener('click', () => {
      loginTabBtn.classList.add('active');
      signupTabBtn.classList.remove('active');
      loginFormContainer.classList.add('active');
      signupFormContainer.classList.remove('active');
      loginError.textContent = '';
    });
    
    signupTabBtn.addEventListener('click', () => {
      signupTabBtn.classList.add('active');
      loginTabBtn.classList.remove('active');
      signupFormContainer.classList.add('active');
      loginFormContainer.classList.remove('active');
      signupError.textContent = '';
    });
    
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Clear previous error
      loginError.textContent = '';
      loginError.style.color = '#ff6b6b';
      
      // Disable the submit button to prevent multiple submissions
      const submitButton = loginForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
      
      // Get form values
      const email = loginEmail.value.trim();
      const password = loginPassword.value;
      
      // Basic validation
      if (!email || !password) {
        loginError.textContent = 'Please enter both email and password';
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
        return;
      }
      
      try {
        // Call the login method from the preload API
        const result = await window.electronAPI.login(email, password);
        
        if (result.user) {
          // Login successful - explicitly request window close
          loginError.style.color = '#4CAF50';
          loginError.textContent = 'Login successful!';
          
          // Explicitly request window close after a short delay
          setTimeout(() => {
            window.electronAPI.closeLoginWindow();
          }, 500);
        } else if (result.error) {
          // Show error message
          loginError.textContent = result.error;
          submitButton.disabled = false;
          submitButton.textContent = 'Login';
        }
      } catch (error) {
        // Handle any unexpected errors
        loginError.textContent = error.message || 'Login failed. Please try again.';
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      }
    });
    
    // Signup form submission
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Clear previous error
      signupError.textContent = '';
      signupError.style.color = '#ff6b6b';
      
      // Disable the submit button to prevent multiple submissions
      const submitButton = signupForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
      
      // Get form values
      const name = signupName.value.trim();
      const email = signupEmail.value.trim();
      const password = signupPassword.value;
      const confirmPassword = signupConfirmPassword.value;
      
      // Basic validation
      if (!name || !email || !password || !confirmPassword) {
        signupError.textContent = 'Please fill out all fields';
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
        return;
      }
      
      if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
        return;
      }
      
      if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters';
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
        return;
      }
      
      try {
        // Call the signup method from the preload API with user metadata
        const result = await window.electronAPI.signup(email, password, { name });
        
        if (result.error) {
          // Show error message
          signupError.textContent = result.error;
          submitButton.disabled = false;
          submitButton.textContent = 'Create Account';
        } else {
          // Success message
          signupError.style.color = '#4CAF50';
          signupError.textContent = 'Account created successfully! Please login.';
          
          // Clear the form
          signupForm.reset();
          
          // Switch to login tab after a short delay
          setTimeout(() => {
            loginTabBtn.click();
          }, 2000);
          
          submitButton.disabled = false;
          submitButton.textContent = 'Create Account';
        }
      } catch (error) {
        // Handle any unexpected errors
        signupError.textContent = error.message || 'Signup failed. Please try again.';
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
      }
    });
  });