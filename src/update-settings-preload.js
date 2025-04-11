// Settings-specific preload script
const { contextBridge, ipcRenderer } = require('electron');

// Expose the same API as the main preload.js
// This ensures the settings window has access to the same functionality
contextBridge.exposeInMainWorld('electronAPI', {
  // Window control functions
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Settings window specific functions
  closeSettingsWindow: () => ipcRenderer.send('close-settings'),
  
  // API key management
  saveApiKeys: (keys) => ipcRenderer.invoke('save-api-keys', keys),
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  
  // Model configuration
  saveModelConfig: (config) => ipcRenderer.invoke('save-model-config', config),
  getModelConfig: () => ipcRenderer.invoke('get-model-config')
});
