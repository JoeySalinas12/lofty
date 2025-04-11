// key-store-service.js - Handle secure storage of API keys locally
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

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
      
      // Create keys file if it doesn't exist
      if (!fs.existsSync(this.keysFile)) {
        fs.writeFileSync(this.keysFile, this.encrypt(JSON.stringify({
          openai: '',
          anthropic: '',
          gemini: ''
        })));
      }
      
      // Create config file if it doesn't exist
      if (!fs.existsSync(this.configFile)) {
        fs.writeFileSync(this.configFile, JSON.stringify({
          reasoning: 'claude',
          math: 'gemini',
          programming: 'gpt'
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
      const encryptedData = this.encrypt(JSON.stringify(keys));
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
        return { openai: '', anthropic: '', gemini: '' };
      }
      
      const encryptedData = fs.readFileSync(this.keysFile, 'utf8');
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error getting API keys:', error);
      return { openai: '', anthropic: '', gemini: '' };
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
          reasoning: 'claude',
          math: 'gemini',
          programming: 'gpt'
        };
      }
      
      const data = fs.readFileSync(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting model configuration:', error);
      return {
        reasoning: 'claude',
        math: 'gemini',
        programming: 'gpt'
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
      return {
        GPT_API_KEY: keys.openai || '',
        CLAUDE_API_KEY: keys.anthropic || '',
        GEMENI_API_KEY: keys.gemini || '' // Keep the typo to match existing code
      };
    } catch (error) {
      console.error('Error exporting API keys to env:', error);
      return {};
    }
  }
}

module.exports = new KeyStoreService();
