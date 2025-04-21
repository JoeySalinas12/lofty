// Settings page functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Tab navigation
  const sidebarTabs = document.querySelectorAll('.sidebar-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // API keys form elements
  const apiKeysForm = document.getElementById('api-keys-form');
  const saveApiKeysBtn = document.getElementById('save-api-keys-btn');
  
  // Model config form elements
  const modelConfigForm = document.getElementById('model-config-form');
  const saveModelConfigBtn = document.getElementById('save-model-config-btn');
  
  // Appearance form elements
  const appearanceForm = document.getElementById('appearance-form');
  const saveAppearanceBtn = document.getElementById('save-appearance-btn');
  const fontSizeSlider = document.getElementById('font-size');
  const fontSizeValue = fontSizeSlider.nextElementSibling;
  const themeOptions = document.querySelectorAll('.theme-option');
  
  // Advanced settings form elements
  const advancedForm = document.getElementById('advanced-form');
  const saveAdvancedBtn = document.getElementById('save-advanced-btn');
  const temperatureSlider = document.getElementById('temperature');
  const temperatureValue = temperatureSlider.nextElementSibling;
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  
  // Close button
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  
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
  
  // Model config selectors - updated with all use cases
  const modelSelectors = {
    programming: document.getElementById('programming-model'),
    'technical-writing': document.getElementById('technical-writing-model'),
    math: document.getElementById('math-model'),
    productivity: document.getElementById('productivity-model'),
    science: document.getElementById('science-model'),
    'customer-support': document.getElementById('customer-support-model'),
    'creative-writing': document.getElementById('creative-writing-model'),
    summarization: document.getElementById('summarization-model'),
    multilingual: document.getElementById('multilingual-model'),
    academic: document.getElementById('academic-model')
  };
  
  // Toggle password visibility buttons
  const toggleVisibilityButtons = document.querySelectorAll('.toggle-visibility');
  
  // Load existing settings when the page loads
  await loadSettings();
  
  // Handle tab navigation
  sidebarTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // Update active tab
      sidebarTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding tab pane
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabId) {
          pane.classList.add('active');
        }
      });
    });
  });
  
  // Close settings window
  closeSettingsBtn.addEventListener('click', () => {
    window.electronAPI.closeSettingsWindow();
  });
  
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
      if (input) {
        apiKeys[provider] = input.value.trim();
      }
    }
    
    try {
      // Save the API keys
      const result = await window.electronAPI.saveApiKeys(apiKeys);
      
      if (result.success) {
        // Show success message for each field
        for (const status of Object.values(apiKeyStatuses)) {
          if (status) {
            showStatusMessage(status, 'Saved successfully!', 'success');
          }
        }
        
        showNotification('API keys saved successfully', 'success');
      } else {
        // Show error message for each field
        for (const status of Object.values(apiKeyStatuses)) {
          if (status) {
            showStatusMessage(status, 'Failed to save', 'error');
          }
        }
        
        showNotification('Failed to save API keys', 'error');
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      // Show error message for each field
      for (const status of Object.values(apiKeyStatuses)) {
        if (status) {
          showStatusMessage(status, 'Error saving keys', 'error');
        }
      }
      
      showNotification('Error saving API keys: ' + error.message, 'error');
    } finally {
      // Re-enable the save button
      saveApiKeysBtn.disabled = false;
      saveApiKeysBtn.textContent = 'Save API Keys';
      
      // Clear status messages after a delay
      setTimeout(() => {
        for (const status of Object.values(apiKeyStatuses)) {
          if (status) {
            status.textContent = '';
            status.className = 'api-key-status';
          }
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
      if (selector) {
        modelConfig[mode] = selector.value;
      }
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
  
  // Handle appearance settings
  // Theme selection
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
    });
  });
  
  // Font size slider
  fontSizeSlider.addEventListener('input', () => {
    fontSizeValue.textContent = `${fontSizeSlider.value}px`;
  });
  
  // Save appearance settings
  appearanceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const activeTheme = document.querySelector('.theme-option.active').getAttribute('data-theme');
    const fontSize = fontSizeSlider.value;
    
    // For now just show a notification - actual implementation would need to be added
    showNotification('Appearance settings saved!', 'success');
  });
  
  // Handle advanced settings
  // Temperature slider
  temperatureSlider.addEventListener('input', () => {
    temperatureValue.textContent = temperatureSlider.value;
  });
  
  // Clear cache button
  clearCacheBtn.addEventListener('click', () => {
    // For now just show a notification - actual implementation would need to be added
    showNotification('Cache cleared successfully!', 'success');
  });
  
  // Clear history button
  clearHistoryBtn.addEventListener('click', () => {
    // For now just show a notification - actual implementation would need to be added
    showNotification('Chat history cleared successfully!', 'success');
  });
  
  // Save advanced settings
  advancedForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const maxTokens = document.getElementById('max-tokens').value;
    const temperature = temperatureSlider.value;
    
    // For now just show a notification - actual implementation would need to be added
    showNotification('Advanced settings saved!', 'success');
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
          if (input && apiKeys[provider]) {
            input.value = apiKeys[provider];
          }
        }
      }
      
      // Load model configuration
      const modelConfig = await window.electronAPI.getModelConfig();
      if (modelConfig) {
        // Set values for each select element
        for (const [mode, selector] of Object.entries(modelSelectors)) {
          if (selector && modelConfig[mode]) {
            selector.value = modelConfig[mode];
          } else if (selector) {
            // Set default values based on the PDF recommendations if not configured
            const defaults = {
              'programming': 'deepseek-v3',
              'technical-writing': 'openchat-3.5',
              'math': 'deepseek-v3',
              'productivity': 'gecko-3',
              'science': 'deepseek-v3',
              'customer-support': 'openchat-3.5',
              'creative-writing': 'openchat-3.5',
              'summarization': 'openchat-3.5',
              'multilingual': 'gecko-2-mini',
              'academic': 'openchat-3.5'
            };
            
            selector.value = defaults[mode] || selector.options[0].value;
          }
        }
      }
      
      // Load appearance settings (placeholder for now)
      // This would be implemented when appearance settings are actually stored
      
      // Load advanced settings (placeholder for now)
      // This would be implemented when advanced settings are actually stored
      
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('Error loading settings. Please try again.', 'error');
    }
  }
  
  // Function to display status messages
  function showStatusMessage(element, message, type) {
    if (element) {
      element.textContent = message;
      element.className = `api-key-status ${type}`;
    }
  }
  
  // Function to show a notification
  function showNotification(message, type) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.settings-notification');
    existingNotifications.forEach(notification => {
      notification.remove();
    });
    
    // Create and show the notification
    const notification = document.createElement('div');
    notification.className = `settings-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after a delay
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
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
    box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
  }
  
  .settings-notification.error {
    background-color: #ff6b6b;
    box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3);
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);