const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const LLMBridge = require('./llm-bridge');
const authService = require('./auth-service');
const chatService = require('./chat-service');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let authWindow;

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
    backgroundColor: '#1e1e1e', // Dark background like in the image
    titleBarStyle: 'hiddenInset', // For macOS to have a native-looking title bar
    autoHideMenuBar: true, // Hide the default menu bar
    frame: false, // Use a frameless window
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools in development
  // mainWindow.webContents.openDevTools();
  
  // Handle window control events
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
    if (authWindow) authWindow.minimize();
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
  // Handle LLM queries - this needs to use invoke/handle for async responses
  ipcMain.handle('query-llm', async (event, model, prompt) => {
    console.log(`Querying ${model} with prompt: ${prompt}`);
    try {
      const response = await LLMBridge.queryLLM(model, prompt);
      
      // Save the message exchange to Supabase
      if (authService.isAuthenticated()) {
        await chatService.saveMessage(model, prompt, response);
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
        const conversations = chatService.groupChatHistory(result.data);
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

  // Handle deleting a chat
  ipcMain.on('delete-chat', (event, chatId) => {
    console.log(`Deleting chat: ${chatId}`);
    // Actual deletion of messages would need to be implemented with Supabase
    // For now, chat deletion only happens in the UI
  });

  // Handle mode changes if needed
  ipcMain.on('mode-changed', (event, mode) => {
    console.log(`Mode changed to: ${mode}`);
  });
}

// Handle LLM queries - this needs to use invoke/handle for async responses
ipcMain.handle('query-llm', async (event, model, prompt, chatId) => {
  console.log(`Querying ${model} with prompt: ${prompt} for chat: ${chatId}`);
  try {
    const response = await LLMBridge.queryLLM(model, prompt);
    
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