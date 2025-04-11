// notification-service.js - Handles notifications and cross-window communication
const { BrowserWindow } = require('electron');

class NotificationService {
  /**
   * Send a notification to all windows
   * @param {string} channel - The notification channel
   * @param {any} data - The data to send
   */
  sendToAllWindows(channel, data) {
    // Get all open windows
    const windows = BrowserWindow.getAllWindows();
    
    // Send the message to each window
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
      }
    });
  }
  
  /**
   * Trigger a local storage event to notify windows of changes
   * @param {BrowserWindow} window - The window to trigger the event in
   * @param {string} key - The storage key
   * @param {any} value - The value to store
   */
  triggerStorageEvent(window, key, value) {
    if (!window || window.isDestroyed()) return;
    
    // Use a script to trigger a storage event that will be caught by listeners
    const script = `
      localStorage.setItem('${key}', '${JSON.stringify(value)}');
      window.dispatchEvent(new StorageEvent('storage', { key: '${key}' }));
    `;
    
    window.webContents.executeJavaScript(script).catch(err => {
      console.error('Error triggering storage event:', err);
    });
  }
  
  /**
   * Notify all windows of a model configuration change
   */
  notifyModelConfigChanged() {
    const windows = BrowserWindow.getAllWindows();
    
    windows.forEach(window => {
      this.triggerStorageEvent(window, 'lofty_model_config_updated', { 
        timestamp: Date.now() 
      });
    });
  }
  
  /**
   * Notify all windows of an API key change
   */
  notifyApiKeysChanged() {
    const windows = BrowserWindow.getAllWindows();
    
    windows.forEach(window => {
      this.triggerStorageEvent(window, 'lofty_api_keys_updated', { 
        timestamp: Date.now() 
      });
    });
  }
}

module.exports = new NotificationService();
