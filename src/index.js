// src/index.js - Main process file
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const authService = require('./auth-service');
const chatService = require('./chat-service');
const keyStoreService = require('./key-store-service');
const messageFormatter = require('./message-formatter');
const llmBridge = require('./llm-bridge');
const modelConfig = require('./model-config');
const notificationService = require('./notification-service');

// Declare mainWindow in broader scope so it can be accessed from multiple functions
let mainWindow = null;
let settingsWindow = null;

// Function to create main window
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    frame: false, // Frameless window for custom title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development environment
  // mainWindow.webContents.openDevTools();

  // Prevent default navigation outside app
  mainWindow.webContents.on('will-navigate', (e, url) => {
    // Only allow navigation to internal pages
    const internalPages = ['index.html', 'login.html', 'settings.html'];
    const isInternalPage = internalPages.some(page => url.endsWith(page));
    
    if (!isInternalPage) {
      e.preventDefault();
    }
  });

  // Handle window close event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create login window
function createLoginWindow() {
  const loginWindow = new BrowserWindow({
    width: 500,
    height: 680,
    resizable: false,
    frame: false, // Frameless window for custom styling
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  loginWindow.loadFile(path.join(__dirname, 'login.html'));
  
  // Close main window if it exists
  if (mainWindow !== null) {
    mainWindow.close();
    mainWindow = null;
  }

  return loginWindow;
}

// Create settings window
function createSettingsWindow() {
  if (settingsWindow !== null) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 750,
    height: 750,
    resizable: true,
    parent: mainWindow,
    modal: true,
    frame: false, // Frameless for consistent styling
    webPreferences: {
      preload: path.join(__dirname, 'update-settings-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// When app is ready, create window
app.whenReady().then(async () => {
  try {
    // Initialize auth service
    const user = await authService.initialize();
    
    if (user) {
      // User is authenticated, load main app
      createWindow();
    } else {
      // User needs to log in
      createLoginWindow();
    }
  } catch (error) {
    console.error('Error during app initialization:', error);
    // If there's an error, default to login screen
    createLoginWindow();
  }

  // Set up app event listeners
  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      if (authService.isAuthenticated()) {
        createWindow();
      } else {
        createLoginWindow();
      }
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set up IPC handlers
function setupIpcHandlers() {
  // Window control
  ipcMain.on('window-minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      window.minimize();
    }
  });

  ipcMain.on('window-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  ipcMain.on('window-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      window.close();
    }
  });

  // Settings window
  ipcMain.on('open-settings', () => {
    createSettingsWindow();
  });

  ipcMain.on('close-settings', () => {
    if (settingsWindow) {
      settingsWindow.close();
    }
  });

  // Authentication handlers
  ipcMain.handle('auth-login', async (event, email, password) => {
    try {
      const result = await authService.signInWithEmail(email, password);
      
      if (result.user) {
        // Login successful, create main window
        createWindow();
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { error: error.message || 'Failed to log in' };
    }
  });

  ipcMain.handle('auth-signup', async (event, email, password, userData) => {
    try {
      return await authService.signUpWithEmail(email, password, userData);
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error.message || 'Failed to create account' };
    }
  });

  ipcMain.handle('auth-logout', async () => {
    try {
      const result = await authService.signOut();
      
      if (result.success) {
        // Create login window
        createLoginWindow();
        
        // Close main window if it exists
        if (mainWindow !== null) {
          mainWindow.close();
          mainWindow = null;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      return { error: error.message || 'Failed to log out' };
    }
  });

  ipcMain.handle('auth-check', () => {
    return authService.isAuthenticated();
  });

  ipcMain.handle('get-current-user', () => {
    return authService.getCurrentUser();
  });

  // Chat handlers
  ipcMain.on('load-chat', (event, chatId) => {
    // This method is mainly for potential future use
    console.log(`Loading chat: ${chatId}`);
  });

  ipcMain.handle('get-chat-history', async () => {
    try {
      const result = await chatService.getChatHistory();
      
      if (result.success) {
        // Organize chats into conversations
        const conversations = chatService.groupChatHistory(result.data, result.uniqueChatIds);
        return { success: true, conversations };
      }
      
      return result;
    } catch (error) {
      console.error('Error getting chat history:', error);
      return { error: error.message || 'Failed to load chat history' };
    }
  });

  ipcMain.handle('delete-chat', async (event, chatId) => {
    try {
      return await chatService.deleteChat(chatId);
    } catch (error) {
      console.error('Error deleting chat:', error);
      return { error: error.message || 'Failed to delete chat' };
    }
  });

  ipcMain.handle('query-llm', async (event, modelId, prompt, chatId) => {
    try {
      // Get API keys first
      const apiKeys = await keyStoreService.exportKeysToEnv();
      
      // Call the LLM bridge with the model, prompt, and API keys
      const response = await llmBridge.queryLLM(modelId, prompt, apiKeys);
      
      // Save the message exchange to Supabase
      chatService.saveMessage(modelId, prompt, response, chatId)
        .catch(err => console.error('Error saving message:', err));
      
      return response;
    } catch (error) {
      console.error('Error querying LLM:', error);
      return `Sorry, there was an error: ${error.message}`;
    }
  });

  // Format markdown
  ipcMain.handle('format-markdown', async (event, markdown) => {
    try {
      return messageFormatter.formatMessage(markdown);
    } catch (error) {
      console.error('Error formatting markdown:', error);
      return markdown;
    }
  });

  // API key and model configuration
  ipcMain.handle('save-api-keys', async (event, keys) => {
    try {
      const success = await keyStoreService.saveApiKeys(keys);
      
      if (success) {
        // Notify other windows of the change
        notificationService.notifyApiKeysChanged();
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error saving API keys:', error);
      return { error: error.message, success: false };
    }
  });

  ipcMain.handle('get-api-keys', async () => {
    try {
      return await keyStoreService.getApiKeys();
    } catch (error) {
      console.error('Error getting API keys:', error);
      return {};
    }
  });

  ipcMain.handle('save-model-config', async (event, config) => {
    try {
      const success = await keyStoreService.saveModelConfig(config);
      
      if (success) {
        // Notify other windows of the change
        notificationService.notifyModelConfigChanged();
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error saving model config:', error);
      return { error: error.message, success: false };
    }
  });

  ipcMain.handle('get-model-config', async () => {
    try {
      return await keyStoreService.getModelConfig();
    } catch (error) {
      console.error('Error getting model config:', error);
      return null;
    }
  });

  // Handle getting model for a specific mode
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

  // Handle getting models for a specific mode
  ipcMain.handle('get-models-for-mode', (event, mode, freeOnly) => {
    try {
      return llmBridge.getModelsForUseCase(mode, freeOnly);
    } catch (error) {
      console.error('Error getting models for mode:', error);
      return [];
    }
  });

  // Handle validating API keys
  ipcMain.handle('validate-api-key', (event, provider, key) => {
    try {
      return llmBridge.validateApiKey(provider, key);
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  });

  // Handle getting model details
  ipcMain.handle('get-model-details', (event, modelId) => {
    try {
      return modelConfig.getModelDetails(modelId);
    } catch (error) {
      console.error('Error getting model details:', error);
      return null;
    }
  });
}

// Set up IPC handlers when app is ready
app.whenReady().then(setupIpcHandlers);