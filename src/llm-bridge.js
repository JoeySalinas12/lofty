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
   * @returns {Promise<string>} - The LLM response
   */
  async queryLLM(model, prompt) {
    return new Promise((resolve, reject) => {
      // Spawn a Python process to handle the query
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        model,
        prompt
      ]);

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
          reject(new Error(`Python process exited with code ${code}: ${error}`));
        } else {
          resolve(result.trim());
        }
      });
    });
  }
}

module.exports = new LLMBridge();