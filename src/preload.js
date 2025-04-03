const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electronAPI', {
  // Send a message to the main process
  changeMode: (mode) => ipcRenderer.send('mode-changed', mode),
  
  // Load a specific chat history
  loadChat: (chatId) => ipcRenderer.send('load-chat', chatId),
  
  // Delete a chat
  deleteChat: (chatId) => ipcRenderer.send('delete-chat', chatId),
  
  // Window control functions
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Query LLM models
  queryLLM: (model, prompt) => ipcRenderer.invoke('query-llm', model, prompt)
});