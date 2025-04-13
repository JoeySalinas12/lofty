const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const LLMBridge = require('./llm-bridge');
const authService = require('./auth-service');
const chatService = require('./chat-service');
const keyStoreService = require('./key-store-service');
const notificationService = require('./notification-service');
// const messageFormatter = require('./message-formatter');
const messageFormatter = require('./message-formatter-math');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let authWindow;
let settingsWindow;

// Check if user is authenticated and show appropriate window
const createAuthWindow = () => {
  // Close the main window if it exists
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }

  authWindow = new BrowserWindow({
    width: 480,
    height: 650, // Increased to accommodate the full name field
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
    frame: false,
    resizable: false,
  });

  // Load the login HTML file
  authWindow.loadFile(path.join(__dirname, 'login.html'));
  
  // For development/debugging
  // authWindow.webContents.openDevTools();
};

const createMainWindow = () => {
  // Close the auth window if it exists
  if (authWindow) {
    authWindow.close();
    authWindow = null;
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: 'rgba(30, 30, 30, 0.85)', // Change to rgba with transparency
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
    frame: false,
    transparent: true, // This is required for transparency
    vibrancy: 'under-window', // Only works on macOS
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools in development
  // mainWindow.webContents.openDevTools();
  
  // Handle window control events
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
    if (authWindow) authWindow.minimize();
    if (settingsWindow) settingsWindow.minimize();
  });
  
  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  
  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
    if (authWindow) authWindow.close();
    if (settingsWindow) settingsWindow.close();
  });
};

// Create settings window
const createSettingsWindow = () => {
  // Create the settings window if it doesn't exist
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  
  // Base window options
  const windowOptions = {
    width: 700,
    height: 650,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    modal: false,
  };

  // Platform-specific settings
  if (process.platform === 'darwin') {
    // On macOS - enable native frame but with custom styling
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.trafficLightPosition = { x: 10, y: 10 }; // Adjust traffic light position
    windowOptions.vibrancy = 'under-window'; // Add vibrancy effect
    windowOptions.frame = true; // Use native frame
  } else {
    // On Windows/Linux - use frameless with custom controls
    windowOptions.frame = false;
    windowOptions.autoHideMenuBar = true;
  }
  
  settingsWindow = new BrowserWindow(windowOptions);
  
  // Explicitly set draggable behavior for macOS
  if (process.platform === 'darwin') {
    // Set the whole window to be draggable
    settingsWindow.setMovable(true);
  }
  
  // Load the settings HTML file
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  
  // For development/debugging
  // settingsWindow.webContents.openDevTools();
  
  // Clean up when window is closed
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  
  // Handle window control events specifically for the settings window
  settingsWindow.on('blur', () => {
    // Re-enable dragging when window loses focus
    if (process.platform === 'darwin') {
      settingsWindow.setMovable(true);
    }
  });
};

// Create window when Electron has finished initialization
app.on('ready', async () => {
  // Initialize auth service first
  await authService.initialize();

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    createMainWindow();
  } else {
    createAuthWindow();
  }

  // Set up authentication IPC handlers
  setupAuthHandlers();
  setupChatHandlers();
  setupSettingsHandlers();
  setupMarkdownHandler();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when the dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    if (authService.isAuthenticated()) {
      createMainWindow();
    } else {
      createAuthWindow();
    }
  }
});

function setupAuthHandlers() {
  // Handle login
  ipcMain.handle('auth-login', async (event, email, password) => {
    console.log(`Login attempt for user: ${email}`);
    const result = await authService.signInWithEmail(email, password);
    
    if (!result.error) {
      console.log(`Login successful for user: ${email}`);
      // Close auth window and open main window
      createMainWindow();
    } else {
      console.log(`Login failed for user: ${email} - ${result.error}`);
    }
    
    return result;
  });

  // Handle signup
  ipcMain.handle('auth-signup', async (event, email, password, userData = {}) => {
    console.log(`Signup attempt for user: ${email}`);
    
    // Validate userData if necessary
    if (userData && typeof userData !== 'object') {
      userData = {};
    }
    
    const result = await authService.signUpWithEmail(email, password, userData);
    
    if (result.error) {
      console.log(`Signup failed for user: ${email} - ${result.error}`);
    } else {
      console.log(`Signup successful for user: ${email}`);
    }
    
    return result;
  });

  // Handle logout
  ipcMain.handle('auth-logout', async () => {
    console.log('User logout attempt');
    const result = await authService.signOut();
    
    if (!result.error) {
      console.log('User logged out successfully');
      // Close main window and open auth window
      createAuthWindow();
    } else {
      console.log(`Logout failed: ${result.error}`);
    }
    
    return result;
  });

  // Check authentication status
  ipcMain.handle('auth-check', () => {
    const isAuthenticated = authService.isAuthenticated();
    console.log(`Auth check: ${isAuthenticated ? 'User is authenticated' : 'User is not authenticated'}`);
    return isAuthenticated;
  });

  // Get current user
  ipcMain.handle('get-current-user', () => {
    return authService.getCurrentUser();
  });
}

function setupChatHandlers() {
  // Handle LLM queries - updated to use stored API keys
  ipcMain.handle('query-llm', async (event, model, prompt, chatId) => {
    console.log(`Querying ${model} with prompt: ${prompt} for chat: ${chatId}`);
    try {
      // Pass the API keys to the LLM bridge
      const apiKeys = await keyStoreService.exportKeysToEnv();
      const response = await LLMBridge.queryLLM(model, prompt, apiKeys);
      
      // Save the message exchange to Supabase
      if (authService.isAuthenticated()) {
        await chatService.saveMessage(model, prompt, response, chatId);
      }
      
      return response;
    } catch (error) {
      console.error(`Error querying LLM: ${error.message}`);
      throw error; // This will be caught in the renderer
    }
  });

  // Handle getting chat history
  ipcMain.handle('get-chat-history', async () => {
    if (!authService.isAuthenticated()) {
      return { error: 'Not authenticated' };
    }
    
    try {
      const result = await chatService.getChatHistory();
      
      if (result.success && result.data) {
        // Group the messages into conversations
        const conversations = chatService.groupChatHistory(result.data, result.uniqueChatIds);
        return { success: true, conversations };
      }
      
      return result;
    } catch (error) {
      console.error('Error getting chat history:', error);
      return { error: error.message };
    }
  });

  // Handle loading a specific chat history
  ipcMain.on('load-chat', (event, chatId) => {
    console.log(`Loading chat: ${chatId}`);
    // Loading chat is now handled in the renderer by storing chat history in memory
  });

  // Handle deleting a chat - updated to delete from Supabase
  ipcMain.handle('delete-chat', async (event, chatId) => {
    console.log(`Deleting chat: ${chatId}`);
    if (authService.isAuthenticated()) {
      const result = await chatService.deleteChat(chatId);
      return result;
    }
    return { error: 'Not authenticated' };
  });

  // Handle mode changes if needed
  ipcMain.on('mode-changed', (event, mode) => {
    console.log(`Mode changed to: ${mode}`);
  });
  
  // Handle getting model for mode
  ipcMain.handle('get-mode-model', async (event, mode) => {
    try {
      const modelConfig = await keyStoreService.getModelConfig();
      return modelConfig[mode] || getDefaultModel(mode);
    } catch (error) {
      console.error('Error getting model for mode:', error);
      return getDefaultModel(mode);
    }
  });
}

function setupSettingsHandlers() {
  // Open settings window
  ipcMain.on('open-settings', () => {
    createSettingsWindow();
  });
  
  // Close settings window
  ipcMain.on('close-settings', () => {
    if (settingsWindow) {
      settingsWindow.close();
      settingsWindow = null;
    }
  });
  
  // Save API keys
  ipcMain.handle('save-api-keys', async (event, keys) => {
    try {
      const result = await keyStoreService.saveApiKeys(keys);
      
      // Notify all windows about the API key change
      if (result) {
        notificationService.notifyApiKeysChanged();
      }
      
      return { success: result };
    } catch (error) {
      console.error('Error saving API keys:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Get API keys
  ipcMain.handle('get-api-keys', async () => {
    try {
      return await keyStoreService.getApiKeys();
    } catch (error) {
      console.error('Error getting API keys:', error);
      return { openai: '', anthropic: '', gemini: '' };
    }
  });
  
  // Save model configuration
  ipcMain.handle('save-model-config', async (event, config) => {
    try {
      const result = await keyStoreService.saveModelConfig(config);
      
      // Notify all windows about the model config change
      if (result) {
        notificationService.notifyModelConfigChanged();
      }
      
      return { success: result };
    } catch (error) {
      console.error('Error saving model configuration:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Get model configuration
  ipcMain.handle('get-model-config', async () => {
    try {
      return await keyStoreService.getModelConfig();
    } catch (error) {
      console.error('Error getting model configuration:', error);
      return getDefaultModelConfig();
    }
  });
}

// Add function to handle markdown formatting
function setupMarkdownHandler() {
  // Handle markdown formatting requests from renderer
  ipcMain.handle('format-markdown', (event, text) => {
    try {
      console.log('Formatting markdown text');
      return messageFormatter.formatMessage(text);
    } catch (error) {
      console.error('Error formatting markdown:', error);
      return text; // Return original text on error
    }
  });
}

// Helper function to get default model for a mode
function getDefaultModel(mode) {
  const defaults = {
    'reasoning': 'claude',
    'math': 'gemini',
    'programming': 'gpt'
  };
  
  return defaults[mode] || 'claude';
}

// Helper function to get default model configuration
function getDefaultModelConfig() {
  return {
    reasoning: 'claude',
    math: 'gemini',
    programming: 'gpt'
  };
}