import { useState, useEffect } from 'react';
import { UpdateInfo } from '../types';

export const useUpdates = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [installing, setInstalling] = useState(false);

  const checkForUpdates = async () => {
    // Simulate update check
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const hasUpdate = Math.random() > 0.7; // 30% chance of update
    
    if (hasUpdate) {
      const mockUpdate: UpdateInfo = {
        version: '2.1.0',
        releaseNotes: `• Enhanced screenshot quality and compression
• Improved Google Sign-in reliability
• Fixed memory leaks in background processes
• Added new keyboard shortcuts
• Performance optimizations for Windows 11`,
        downloadUrl: 'https://example.com/update.exe',
        mandatory: Math.random() > 0.8 // 20% chance of mandatory update
      };
      
      setUpdateInfo(mockUpdate);
      setUpdateAvailable(true);
    }
  };

  const downloadUpdate = async () => {
    if (!updateInfo) return;
    
    setDownloading(true);
    setDownloadProgress(0);
    
    // Simulate download progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDownloadProgress(i);
    }
    
    setDownloading(false);
  };

  const installUpdate = async () => {
    setInstalling(true);
    
    // Simulate installation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setInstalling(false);
    setUpdateAvailable(false);
    setUpdateInfo(null);
    setDownloadProgress(0);
    
    // In real app, this would restart the application
    alert('Update installed successfully! App will restart.');
  };

  const dismissUpdate = () => {
    if (updateInfo?.mandatory) return; // Can't dismiss mandatory updates
    setUpdateAvailable(false);
    setUpdateInfo(null);
  };

  useEffect(() => {
    // Check for updates on app start
    checkForUpdates();
    
    // Set up periodic update checks (every 30 minutes)
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    installing,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdate
  };
};