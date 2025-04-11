// Settings page functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Get UI elements
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const apiKeysForm = document.getElementById('api-keys-form');
  const modelConfigForm = document.getElementById('model-config-form');
  const saveApiKeysBtn = document.getElementById('save-api-keys-btn');
  const saveModelConfigBtn = document.getElementById('save-model-config-btn');
  
  // API key input fields
  const openaiKeyInput = document.getElementById('openai-key');
  const anthropicKeyInput = document.getElementById('anthropic-key');
  const geminiKeyInput = document.getElementById('gemini-key');
  
  // API key status elements
  const openaiKeyStatus = document.getElementById('openai-key-status');
  const anthropicKeyStatus = document.getElementById('anthropic-key-status');
  const geminiKeyStatus = document.getElementById('gemini-key-status');
  
  // Model config selectors
  const reasoningModelSelect = document.getElementById('reasoning-model');
  const mathModelSelect = document.getElementById('math-model');
  const programmingModelSelect = document.getElementById('programming-model');
  
  // Toggle password visibility buttons
  const toggleVisibilityButtons = document.querySelectorAll('.toggle-visibility');
  
  // Load existing settings when the page loads
  await loadSettings();
  
  // Close settings window and go back to main window
  closeSettingsBtn.addEventListener('click', () => {
    window.electronAPI.closeSettingsWindow();
  });
  
  // Save API keys
  apiKeysForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable the save button while processing
    saveApiKeysBtn.disabled = true;
    saveApiKeysBtn.textContent = 'Saving...';
    
    // Get API key values
    const openaiKey = openaiKeyInput.value.trim();
    const anthropicKey = anthropicKeyInput.value.trim();
    const geminiKey = geminiKeyInput.value.trim();
    
    try {
      // Save the API keys
      const result = await window.electronAPI.saveApiKeys({
        openai: openaiKey,
        anthropic: anthropicKey,
        gemini: geminiKey
      });
      
      if (result.success) {
        showStatusMessage(openaiKeyStatus, 'Saved successfully!', 'success');
        showStatusMessage(anthropicKeyStatus, 'Saved successfully!', 'success');
        showStatusMessage(geminiKeyStatus, 'Saved successfully!', 'success');
      } else {
        showStatusMessage(openaiKeyStatus, 'Failed to save', 'error');
        showStatusMessage(anthropicKeyStatus, 'Failed to save', 'error');
        showStatusMessage(geminiKeyStatus, 'Failed to save', 'error');
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      showStatusMessage(openaiKeyStatus, 'Error saving keys', 'error');
    } finally {
      // Re-enable the save button
      saveApiKeysBtn.disabled = false;
      saveApiKeysBtn.textContent = 'Save API Keys';
      
      // Clear status messages after a delay
      setTimeout(() => {
        clearStatusMessages();
      }, 3000);
    }
  });
  
  // Save model configuration
  modelConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable the save button while processing
    saveModelConfigBtn.disabled = true;
    saveModelConfigBtn.textContent = 'Saving...';
    
    // Get selected model values
    const reasoningModel = reasoningModelSelect.value;
    const mathModel = mathModelSelect.value;
    const programmingModel = programmingModelSelect.value;
    
    try {
      // Save the model configuration
      const result = await window.electronAPI.saveModelConfig({
        reasoning: reasoningModel,
        math: mathModel,
        programming: programmingModel
      });
      
      if (result.success) {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'settings-notification success';
        notification.textContent = 'Model configuration saved successfully!';
        document.body.appendChild(notification);
        
        // Remove notification after a delay
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      } else {
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'settings-notification error';
        notification.textContent = 'Failed to save model configuration!';
        document.body.appendChild(notification);
        
        // Remove notification after a delay
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving model configuration:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'settings-notification error';
      notification.textContent = 'Error saving configuration: ' + error.message;
      document.body.appendChild(notification);
      
      // Remove notification after a delay
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
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
        openaiKeyInput.value = apiKeys.openai || '';
        anthropicKeyInput.value = apiKeys.anthropic || '';
        geminiKeyInput.value = apiKeys.gemini || '';
      }
      
      // Load model configuration
      const modelConfig = await window.electronAPI.getModelConfig();
      if (modelConfig) {
        reasoningModelSelect.value = modelConfig.reasoning || 'claude';
        mathModelSelect.value = modelConfig.math || 'gemini';
        programmingModelSelect.value = modelConfig.programming || 'gpt';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  // Function to display status messages
  function showStatusMessage(element, message, type) {
    element.textContent = message;
    element.className = `api-key-status ${type}`;
  }
  
  // Function to clear all status messages
  function clearStatusMessages() {
    openaiKeyStatus.textContent = '';
    anthropicKeyStatus.textContent = '';
    geminiKeyStatus.textContent = '';
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
`;
document.head.appendChild(style);
