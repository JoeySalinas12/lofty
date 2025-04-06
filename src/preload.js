const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electronAPI', {
  // Window control functions
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
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
  deleteChat: (chatId) => ipcRenderer.send('delete-chat', chatId),
  queryLLM: (model, prompt) => ipcRenderer.invoke('query-llm', model, prompt),
  
  // Chat history
  getChatHistory: () => ipcRenderer.invoke('get-chat-history'),
  saveChat: (chatId, chatData) => ipcRenderer.invoke('save-chat', chatId, chatData)
});