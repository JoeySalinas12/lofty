const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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