const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Screenshot functionality
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  
  // Authentication functionality
  openAuthUrl: () => ipcRenderer.invoke('open-auth-url'),
  onAuthSuccess: (callback) => ipcRenderer.on('auth-success', callback),
  
  // App events
  onCaptureScreenshot: (callback) => ipcRenderer.on('capture-screenshot', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onToggleTracking: (callback) => ipcRenderer.on('toggle-tracking', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
