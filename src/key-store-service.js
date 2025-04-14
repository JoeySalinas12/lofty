// key-store-service.js - Enhanced version for multiple API keys
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const modelConfig = require('./model-config');

class KeyStoreService {
  constructor() {
    // Create storage directory if it doesn't exist
    this.storageDir = path.join(os.homedir(), '.lofty');
    this.keysFile = path.join(this.storageDir, 'api-keys.json');
    this.configFile = path.join(this.storageDir, 'model-config.json');
    
    // Create an encryption key from machine-specific data
    // This is a simple approach - a production app might use more secure methods
    this.encryptionKey = this.generateEncryptionKey();
    
    this.initializeStorage();
  }
  
  /**
   * Initialize the storage directory and files
   */
  initializeStorage() {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
        console.log(`Created storage directory at ${this.storageDir}`);
      }
      
      // Create keys file with default empty keys if it doesn't exist
      if (!fs.existsSync(this.keysFile)) {
        // Initialize with all possible API keys that might be needed
        const defaultKeys = {
          openai: '',     // For GPT models
          anthropic: '',  // For Claude models
          gemini: '',     // For Gemini models
          deepseek: '',   // For DeepSeek models
          openchat: '',   // For OpenChat models
          yi: '',         // For Yi models
          gecko: ''       // For Gecko models
        };
        
        fs.writeFileSync(this.keysFile, this.encrypt(JSON.stringify(defaultKeys)));
      }
      
      // Create config file with default models if it doesn't exist
      if (!fs.existsSync(this.configFile)) {
        // Get default models for each mode/use case
        const reasoningModel = modelConfig.getDefaultModelForUseCase('reasoning', true);
        const mathModel = modelConfig.getDefaultModelForUseCase('math', true);
        const programmingModel = modelConfig.getDefaultModelForUseCase('programming', true);
        
        fs.writeFileSync(this.configFile, JSON.stringify({
          reasoning: reasoningModel,
          math: mathModel,
          programming: programmingModel
        }));
      }
    } catch (error) {
      console.error('Error initializing key storage:', error);
    }
  }
  
  /**
   * Generate a simple encryption key based on machine-specific data
   * This provides basic obfuscation, not true security
   */
  generateEncryptionKey() {
    const machineId = `${os.hostname()}-${os.platform()}-${os.arch()}`;
    return crypto.createHash('sha256').update(machineId).digest('hex').slice(0, 32);
  }
  
  /**
   * Encrypt data using AES-256
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted text
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plain text on error
    }
  }
  
  /**
   * Decrypt data
   * @param {string} encryptedText - Text to decrypt
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedText) {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Return the input if decryption fails
    }
  }
  
  /**
   * Save API keys to the encrypted storage
   * @param {object} keys - Object containing API keys
   * @returns {Promise<boolean>} - Success status
   */
  async saveApiKeys(keys) {
    try {
      // Get current keys first to make sure we don't lose any
      const currentKeys = await this.getApiKeys();
      
      // Update keys with new values, keeping existing ones
      const updatedKeys = { ...currentKeys, ...keys };
      
      const encryptedData = this.encrypt(JSON.stringify(updatedKeys));
      fs.writeFileSync(this.keysFile, encryptedData);
      return true;
    } catch (error) {
      console.error('Error saving API keys:', error);
      return false;
    }
  }
  
  /**
   * Get API keys from the encrypted storage
   * @returns {Promise<object>} - API keys object
   */
  async getApiKeys() {
    try {
      if (!fs.existsSync(this.keysFile)) {
        return {
          openai: '', anthropic: '', gemini: '',
          deepseek: '', openchat: '', yi: '', gecko: ''
        };
      }
      
      const encryptedData = fs.readFileSync(this.keysFile, 'utf8');
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error getting API keys:', error);
      return {
        openai: '', anthropic: '', gemini: '',
        deepseek: '', openchat: '', yi: '', gecko: ''
      };
    }
  }
  
  /**
   * Save model configuration
   * @param {object} config - Model configuration
   * @returns {Promise<boolean>} - Success status
   */
  async saveModelConfig(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Error saving model configuration:', error);
      return false;
    }
  }
  
  /**
   * Get model configuration
   * @returns {Promise<object>} - Model configuration
   */
  async getModelConfig() {
    try {
      if (!fs.existsSync(this.configFile)) {
        return {
          reasoning: modelConfig.getDefaultModelForUseCase('reasoning', true),
          math: modelConfig.getDefaultModelForUseCase('math', true),
          programming: modelConfig.getDefaultModelForUseCase('programming', true)
        };
      }
      
      const data = fs.readFileSync(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      // Ensure all required modes are present
      if (!config.reasoning) {
        config.reasoning = modelConfig.getDefaultModelForUseCase('reasoning', true);
      }
      if (!config.math) {
        config.math = modelConfig.getDefaultModelForUseCase('math', true);
      }
      if (!config.programming) {
        config.programming = modelConfig.getDefaultModelForUseCase('programming', true);
      }
      
      return config;
    } catch (error) {
      console.error('Error getting model configuration:', error);
      return {
        reasoning: modelConfig.getDefaultModelForUseCase('reasoning', true),
        math: modelConfig.getDefaultModelForUseCase('math', true),
        programming: modelConfig.getDefaultModelForUseCase('programming', true)
      };
    }
  }
  
  /**
   * Export API keys to environment-compatible format
   * @returns {Promise<object>} - Environment variables object
   */
  async exportKeysToEnv() {
    try {
      const keys = await this.getApiKeys();
      const envVars = {};
      
      // Export all API keys to environment variables
      Object.keys(keys).forEach(keyName => {
        // Different providers use different environment variable names
        switch (keyName) {
          case 'openai':
            envVars['GPT_API_KEY'] = keys[keyName] || '';
            break;
          case 'anthropic':
            envVars['CLAUDE_API_KEY'] = keys[keyName] || '';
            break;
          case 'gemini':
            // Keep both spellings for backward compatibility
            envVars['GEMINI_API_KEY'] = keys[keyName] || '';
            envVars['GEMENI_API_KEY'] = keys[keyName] || ''; // Typo in original code
            break;
          default:
            // Generate standard environment variable names for other providers
            const envName = `${keyName.toUpperCase()}_API_KEY`;
            envVars[envName] = keys[keyName] || '';
        }
      });
      
      return envVars;
    } catch (error) {
      console.error('Error exporting API keys to env:', error);
      return {};
    }
  }
  
  /**
   * Get model details for a specific mode
   * @param {string} mode - The mode (reasoning, math, programming)
   * @returns {Promise<object>} - Model details
   */
  async getModelForMode(mode) {
    try {
      const config = await this.getModelConfig();
      const modelId = config[mode];
      
      if (!modelId) {
        // If no model is configured, use default
        return modelConfig.getDefaultModelForUseCase(
          this.modeToUseCase(mode), 
          true
        );
      }
      
      return modelId;
    } catch (error) {
      console.error('Error getting model for mode:', error);
      return modelConfig.getDefaultModelForUseCase(
        this.modeToUseCase(mode), 
        true
      );
    }
  }
  
  /**
   * Map app modes to use cases from model-config.js
   * @param {string} mode - The app mode
   * @returns {string} - The corresponding use case
   */
  modeToUseCase(mode) {
    const modeMap = {
      'reasoning': 'reasoning',
      'math': 'math',
      'programming': 'programming'
    };
    
    return modeMap[mode] || mode;
  }
}

module.exports = new KeyStoreService();