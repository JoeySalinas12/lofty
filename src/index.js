// Add the following functions to setupChatHandlers() in your src/index.js file:

// Handle getting model details
ipcMain.handle('get-model-details', async (event, modelId) => {
  try {
    const details = modelConfig.getModelDetails(modelId);
    
    if (details) {
      // Enrich with API key availability
      const apiKeys = await keyStoreService.getApiKeys();
      
      if (details.requiresApiKey) {
        const apiKeyName = details.apiKeyName;
        details.hasApiKey = !!(apiKeys[apiKeyName] && apiKeys[apiKeyName].trim() !== '');
      } else {
        details.hasApiKey = true; // No API key required
      }
      
      return details;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting model details:', error);
    return null;
  }
});

// Replace the existing get-mode-model handler with this updated version
ipcMain.handle('get-mode-model', async (event, mode) => {
  try {
    // Get the configured model from settings
    const modelConf = await keyStoreService.getModelConfig();
    
    if (modelConf && modelConf[mode]) {
      const configuredModelId = modelConf[mode];
      
      // Check if this is a paid model that requires an API key
      const modelDetails = modelConfig.getModelDetails(configuredModelId);
      
      if (modelDetails && modelDetails.requiresApiKey) {
        // Get API keys to check if we have the required key
        const apiKeys = await keyStoreService.getApiKeys();
        const apiKeyName = modelDetails.apiKeyName;
        
        // Check if the required API key is available
        if (!apiKeys[apiKeyName] || apiKeys[apiKeyName].trim() === '') {
          console.log(`API key for ${configuredModelId} is not available, using free alternative`);
          
          // Fall back to a free model for this use case
          return modelConfig.getDefaultModelForUseCase(mode, true); // true = preferFree
        }
      }
      
      // If all checks pass, return the configured model
      return configuredModelId;
    }
    
    // If no configured model, get the default for this use case
    return modelConfig.getDefaultModelForUseCase(mode, true);
  } catch (error) {
    console.error('Error getting model for mode:', error);
    
    // Get the default free model for this mode as fallback
    return modelConfig.getDefaultModelForUseCase(mode, true);
  }
});