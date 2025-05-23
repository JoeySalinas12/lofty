const { contextBridge, ipcRenderer, shell } = require('electron');

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electronAPI', {
  // Window control functions
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  closeLoginWindow: () => ipcRenderer.send('close-login-window'),

  // Markdown formatting
  formatMarkdown: (text) => ipcRenderer.invoke('format-markdown', text),
  
  // Mode change
  changeMode: (mode) => ipcRenderer.send('mode-changed', mode),
  
  // Authentication
  login: (email, password) => ipcRenderer.invoke('auth-login', email, password),
  signup: (email, password, userData) => ipcRenderer.invoke('auth-signup', email, password, userData),
  logout: () => ipcRenderer.invoke('auth-logout'),
  checkAuth: () => ipcRenderer.invoke('auth-check'),
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  
  // Chat functionality
  loadChat: (chatId) => ipcRenderer.send('load-chat', chatId),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),
  queryLLM: (model, prompt, chatId) => ipcRenderer.invoke('query-llm', model, prompt, chatId),
  
  // Chat history
  getChatHistory: () => ipcRenderer.invoke('get-chat-history'),
  saveChat: (chatId, chatData) => ipcRenderer.invoke('save-chat', chatId, chatData),
  
  // Settings functionality
  openSettings: () => ipcRenderer.send('open-settings'),
  closeSettingsWindow: () => ipcRenderer.send('close-settings'),
  
  // API key management
  saveApiKeys: (keys) => ipcRenderer.invoke('save-api-keys', keys),
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  
  // Model configuration
  saveModelConfig: (config) => ipcRenderer.invoke('save-model-config', config),
  getModelConfig: () => ipcRenderer.invoke('get-model-config'),
  
  // New functions for appearance settings
  saveAppearanceSettings: (settings) => ipcRenderer.invoke('save-appearance-settings', settings),
  getAppearanceSettings: () => ipcRenderer.invoke('get-appearance-settings'),
  
  // New functions for advanced settings
  saveAdvancedSettings: (settings) => ipcRenderer.invoke('save-advanced-settings', settings),
  getAdvancedSettings: () => ipcRenderer.invoke('get-advanced-settings'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  clearChatHistory: () => ipcRenderer.invoke('clear-chat-history')
});