// llm-bridge.js - Enhanced version supporting all LLMs from the model-config.js

const { spawn } = require('child_process');
const path = require('path');
const modelConfig = require('./model-config');

class LLMBridge {
  constructor() {
    this.pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    this.scriptPath = path.join(__dirname, 'llm_service.py');
  }

  /**
   * Query an LLM model with the given prompt
   * @param {string} modelId - The model ID to use (from model-config.js)
   * @param {string} prompt - The user's prompt
   * @param {object} apiKeys - API keys for different models
   * @returns {Promise<string>} - The LLM response
   */
  async queryLLM(modelId, prompt, apiKeys = {}) {
    // Get model details from config
    const modelDetails = modelConfig.getModelDetails(modelId) || 
                         modelConfig.getModelDetails(modelConfig.convertLegacyModelName(modelId));
    
    if (!modelDetails) {
      return Promise.reject(new Error(`Unknown model: ${modelId}`));
    }

    // Check if model requires API key and if it's available
    if (modelDetails.requiresApiKey) {
      const apiKeyName = modelDetails.apiEnvName;
      const apiKey = apiKeys[apiKeyName] || process.env[apiKeyName] || '';
      
      if (!apiKey) {
        return Promise.reject(
          new Error(`${modelDetails.name} requires an API key. Please add it in Settings.`)
        );
      }
    }

    return new Promise((resolve, reject) => {
      // Prepare environment variables with all API keys
      const env = { ...process.env, ...apiKeys };

      // Log that we're querying a specific model
      console.log(`Querying ${modelDetails.name} (${modelId})...`);

      // Spawn a Python process to handle the query
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        modelId,
        prompt
      ], { env });

      let result = '';
      let error = '';

      // Collect data from stdout
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      // Collect any errors
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          // Check for specific API key errors
          if (error.includes('API key')) {
            reject(new Error(`Missing or invalid API key for ${modelDetails.name}. Please check your settings.`));
          } else {
            reject(new Error(`Error from ${modelDetails.name}: ${error}`));
          }
        } else {
          resolve(result.trim());
        }
      });
    });
  }

  /**
   * Check if API keys are valid for the given model
   * @param {string} modelId - The model to check keys for
   * @param {string} apiKey - API key to check
   * @returns {Promise<boolean>} - Whether the key is valid
   */
  async validateApiKey(modelId, apiKey) {
    // Get model details from config
    const modelDetails = modelConfig.getModelDetails(modelId);
    if (!modelDetails) return false;
    
    // If model doesn't require API key, it's always valid
    if (!modelDetails.requiresApiKey) return true;

    // This is a simple check - just verifies the key is not empty and has 
    // the expected format. A production app would validate against the API.
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }

    // Check key format based on provider
    switch (modelDetails.provider.toLowerCase()) {
      case 'openai':
        return apiKey.startsWith('sk-');
      case 'anthropic':
        return apiKey.startsWith('sk-ant-');
      case 'google':
        return apiKey.startsWith('AIza');
      case 'deepseek':
        return apiKey.length > 10; // Simple length check for now
      case 'openchat':
      case '01.ai':
      case 'gecko':
        // For free models, any non-empty key is considered valid for now
        return apiKey.length > 0;
      default:
        return false;
    }
  }
  
  /**
   * Get the default free model for a use case
   * @param {string} useCase - The use case
   * @returns {string} - The default free model ID
   */
  getDefaultFreeModel(useCase) {
    return modelConfig.getDefaultModelForUseCase(useCase, true);
  }
  
  /**
   * Get all available models for a specific use case
   * @param {string} useCase - The use case
   * @param {boolean} freeOnly - Whether to return only free models
   * @returns {object[]} - Array of model objects
   */
  getModelsForUseCase(useCase, freeOnly = false) {
    const useCaseModels = modelConfig.USE_CASE_MODELS[useCase] || {};
    const models = [];
    
    if (!freeOnly && useCaseModels.paid) {
      useCaseModels.paid.forEach(id => {
        const model = modelConfig.getModelDetails(id);
        if (model) models.push(model);
      });
    }
    
    if (useCaseModels.free) {
      useCaseModels.free.forEach(id => {
        const model = modelConfig.getModelDetails(id);
        if (model) models.push(model);
      });
    }
    
    return models;
  }
}

module.exports = new LLMBridge();