// llm-bridge.js - This file will handle communication with your Python backend

const { spawn } = require('child_process');
const path = require('path');

class LLMBridge {
  constructor() {
    this.pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    this.scriptPath = path.join(__dirname, 'llm_service.py');
  }

  /**
   * Query an LLM model with the given prompt
   * @param {string} model - The model to use (e.g., "gpt", "claude", "gemini")
   * @param {string} prompt - The user's prompt
   * @param {object} apiKeys - API keys for different models
   * @returns {Promise<string>} - The LLM response
   */
  async queryLLM(model, prompt, apiKeys = {}) {
    return new Promise((resolve, reject) => {
      // Convert API keys to environment variables for the Python process
      const env = {
        ...process.env,
        GPT_API_KEY: apiKeys.GPT_API_KEY || process.env.GPT_API_KEY || '',
        CLAUDE_API_KEY: apiKeys.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY || '',
        GEMENI_API_KEY: apiKeys.GEMENI_API_KEY || process.env.GEMENI_API_KEY || '' // Keeping the typo for consistency
      };

      // Spawn a Python process to handle the query
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        model,
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
            reject(new Error('Missing or invalid API key. Please check your settings.'));
          } else {
            reject(new Error(`Python process exited with code ${code}: ${error}`));
          }
        } else {
          resolve(result.trim());
        }
      });
    });
  }

  /**
   * Check if API keys are valid for the given model
   * @param {string} model - The model to check keys for
   * @param {object} apiKeys - API keys to check
   * @returns {Promise<boolean>} - Whether the keys are valid
   */
  async validateApiKey(model, apiKey) {
    // This is a simple check - just verifies the key is not empty and has 
    // the expected format. A production app would validate against the API.
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }

    // Check key format based on model
    switch (model) {
      case 'gpt':
        return apiKey.startsWith('sk-');
      case 'claude':
        return apiKey.startsWith('sk-ant-');
      case 'gemini':
        return apiKey.startsWith('AIza');
      default:
        return false;
    }
  }
}

module.exports = new LLMBridge();