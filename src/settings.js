// Settings page functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Get UI elements
  const apiKeysForm = document.getElementById('api-keys-form');
  const modelConfigForm = document.getElementById('model-config-form');
  const saveApiKeysBtn = document.getElementById('save-api-keys-btn');
  const saveModelConfigBtn = document.getElementById('save-model-config-btn');
  
  // All API key input fields
  const apiKeyInputs = {
    // Paid models
    openai: document.getElementById('openai-key'),
    anthropic: document.getElementById('anthropic-key'),
    gemini: document.getElementById('gemini-key'),
    // Optional/free models
    deepseek: document.getElementById('deepseek-key'),
    openchat: document.getElementById('openchat-key'),
    yi: document.getElementById('yi-key'),
    gecko: document.getElementById('gecko-key')
  };
  
  // API key status elements
  const apiKeyStatuses = {
    openai: document.getElementById('openai-key-status'),
    anthropic: document.getElementById('anthropic-key-status'),
    gemini: document.getElementById('gemini-key-status'),
    deepseek: document.getElementById('deepseek-key-status'),
    openchat: document.getElementById('openchat-key-status'),
    yi: document.getElementById('yi-key-status'),
    gecko: document.getElementById('gecko-key-status')
  };
  
  // Model config selectors
  const modelSelectors = {
    reasoning: document.getElementById('reasoning-model'),
    math: document.getElementById('math-model'),
    programming: document.getElementById('programming-model')
  };
  
  // Toggle password visibility buttons
  const toggleVisibilityButtons = document.querySelectorAll('.toggle-visibility');
  
  // Load existing settings when the page loads
  await loadSettings();
  
  // Save API keys
  apiKeysForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable the save button while processing
    saveApiKeysBtn.disabled = true;
    saveApiKeysBtn.textContent = 'Saving...';
    
    // Create an object to store all API keys
    const apiKeys = {};
    
    // Get all API key values
    for (const [provider, input] of Object.entries(apiKeyInputs)) {
      apiKeys[provider] = input.value.trim();
    }
    
    try {
      // Save the API keys
      const result = await window.electronAPI.saveApiKeys(apiKeys);
      
      if (result.success) {
        // Show success message for each field
        for (const status of Object.values(apiKeyStatuses)) {
          showStatusMessage(status, 'Saved successfully!', 'success');
        }
      } else {
        // Show error message for each field
        for (const status of Object.values(apiKeyStatuses)) {
          showStatusMessage(status, 'Failed to save', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      // Show error message for each field
      for (const status of Object.values(apiKeyStatuses)) {
        showStatusMessage(status, 'Error saving keys', 'error');
      }
    } finally {
      // Re-enable the save button
      saveApiKeysBtn.disabled = false;
      saveApiKeysBtn.textContent = 'Save API Keys';
      
      // Clear status messages after a delay
      setTimeout(() => {
        for (const status of Object.values(apiKeyStatuses)) {
          status.textContent = '';
          status.className = 'api-key-status';
        }
      }, 3000);
    }
  });
  
  // Save model configuration
  modelConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable the save button while processing
    saveModelConfigBtn.disabled = true;
    saveModelConfigBtn.textContent = 'Saving...';
    
    // Create an object for model configuration
    const modelConfig = {};
    
    // Get all model selections
    for (const [mode, selector] of Object.entries(modelSelectors)) {
      modelConfig[mode] = selector.value;
    }
    
    try {
      // Save the model configuration
      const result = await window.electronAPI.saveModelConfig(modelConfig);
      
      if (result.success) {
        // Show success notification
        showNotification('Model configuration saved successfully!', 'success');
      } else {
        // Show error notification
        showNotification('Failed to save model configuration!', 'error');
      }
    } catch (error) {
      console.error('Error saving model configuration:', error);
      // Show error notification
      showNotification('Error saving configuration: ' + error.message, 'error');
    } finally {
      // Re-enable the save button
      saveModelConfigBtn.disabled = false;
      saveModelConfigBtn.textContent = 'Save Configuration';
    }
  });
  
  // Toggle password visibility
  toggleVisibilityButtons.forEach(button => {
    button.addEventListener('click', () => {
      const inputId = button.getAttribute('data-for');
      const input = document.getElementById(inputId);
      
      if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
      } else {
        input.type = 'password';
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
      }
    });
  });
  
  // Function to load existing settings
  async function loadSettings() {
    try {
      // Load API keys
      const apiKeys = await window.electronAPI.getApiKeys();
      if (apiKeys) {
        // Set values for each input field
        for (const [provider, input] of Object.entries(apiKeyInputs)) {
          if (apiKeys[provider]) {
            input.value = apiKeys[provider];
          }
        }
      }
      
      // Load model configuration
      const modelConfig = await window.electronAPI.getModelConfig();
      if (modelConfig) {
        // Set values for each select element
        for (const [mode, selector] of Object.entries(modelSelectors)) {
          if (modelConfig[mode]) {
            selector.value = modelConfig[mode];
          } else {
            // Set default values if nothing is configured
            switch (mode) {
              case 'reasoning':
                selector.value = 'deepseek-v3';
                break;
              case 'math':
                selector.value = 'deepseek-v3';
                break;
              case 'programming':
                selector.value = 'deepseek-coder';
                break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('Error loading settings. Please try again.', 'error');
    }
  }
  
  // Function to display status messages
  function showStatusMessage(element, message, type) {
    element.textContent = message;
    element.className = `api-key-status ${type}`;
  }
  
  // Function to show a notification
  function showNotification(message, type) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.settings-notification');
    existingNotifications.forEach(notification => {
      document.body.removeChild(notification);
    });
    
    // Create and show the notification
    const notification = document.createElement('div');
    notification.className = `settings-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after a delay
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
});

// Add styles for notification
const style = document.createElement('style');
style.textContent = `
  .settings-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    animation: slideIn 0.3s ease forwards;
    z-index: 1000;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .settings-notification.success {
    background-color: #4CAF50;
  }
  
  .settings-notification.error {
    background-color: #ff6b6b;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .subsection-header {
    color: #bbbbbb;
    font-size: 16px;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  .subsection-description {
    color: #888888;
    font-size: 13px;
    margin-bottom: 15px;
    font-style: italic;
  }
`;
document.head.appendChild(style);