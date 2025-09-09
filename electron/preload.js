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
  
  // Development functionality
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),
  isDevToolsOpen: () => ipcRenderer.invoke('is-devtools-open'),
  
  // HTTP proxy functionality
  proxyHttpRequest: (requestData) => ipcRenderer.invoke('proxy-http-request', requestData),
  
  // Machine ID functionality
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  
  // Update functionality
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
