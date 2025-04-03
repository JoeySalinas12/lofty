const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const LLMBridge = require('./llm-bridge');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

const createWindow = () => {
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
    mainWindow.minimize();
  });
  
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  
  ipcMain.on('window-close', () => {
    mainWindow.close();
  });
};

// Create window when Electron has finished initialization
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when the dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle any IPC messages from the renderer process
ipcMain.on('mode-changed', (event, mode) => {
  console.log(`Mode changed to: ${mode}`);
  // Handle mode changes if needed
});

// Handle loading a specific chat history
ipcMain.on('load-chat', (event, chatId) => {
  console.log(`Loading chat: ${chatId}`);
  // In a real app, you would load the chat data here
  // and send it back to the renderer
});

// Handle deleting a chat
ipcMain.on('delete-chat', (event, chatId) => {
  console.log(`Deleting chat: ${chatId}`);
  // In a real app, you would delete the chat data from storage here
});

// Handle LLM queries - this needs to use invoke/handle for async responses
ipcMain.handle('query-llm', async (event, model, prompt) => {
  console.log(`Querying ${model} with prompt: ${prompt}`);
  try {
    const response = await LLMBridge.queryLLM(model, prompt);
    return response;
  } catch (error) {
    console.error(`Error querying LLM: ${error.message}`);
    throw error; // This will be caught in the renderer
  }
});