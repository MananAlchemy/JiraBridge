const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Screenshot functionality
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  
  // App events
  onCaptureScreenshot: (callback) => ipcRenderer.on('capture-screenshot', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onToggleTracking: (callback) => ipcRenderer.on('toggle-tracking', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
