import { useState, useEffect } from 'react';
import { UpdateInfo } from '../types';
import { logger } from '../utils/logger';

export const useUpdates = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [installing, setInstalling] = useState(false);

  // Set up Electron event listeners
  useEffect(() => {
    if (!window.electronAPI) {
      logger.warn('Electron API not available - running in web mode');
      return;
    }

    // Listen for update available
    const handleUpdateAvailable = (info: any) => {
      logger.info('Update available received:', info);
      const updateData: UpdateInfo = {
        version: info.version || 'Unknown',
        releaseNotes: info.releaseNotes || 'Bug fixes and improvements',
        downloadUrl: info.downloadUrl || '',
        mandatory: info.mandatory || false,
        releaseDate: new Date(info.releaseDate || Date.now()),
        size: info.size || 0
      };
      
      setUpdateInfo(updateData);
      setUpdateAvailable(true);
    };

    // Listen for download progress
    const handleDownloadProgress = (progress: any) => {
      logger.info('Download progress:', progress);
      setDownloading(true);
      setDownloadProgress(Math.round(progress.percent || 0));
    };

    // Listen for update downloaded
    const handleUpdateDownloaded = (info: any) => {
      logger.info('Update downloaded:', info);
      setDownloading(false);
      setDownloadProgress(100);
    };

    // Set up event listeners
    window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    window.electronAPI.onDownloadProgress(handleDownloadProgress);
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);

    // Cleanup function
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('update-available');
        window.electronAPI.removeAllListeners('download-progress');
        window.electronAPI.removeAllListeners('update-downloaded');
      }
    };
  }, []);

  const checkForUpdates = async () => {
    if (window.electronAPI) {
      logger.info('Checking for updates via Electron API');
      // The auto-updater will automatically check and send events
      // No need to call anything here as it's handled by the main process
    } else {
      logger.warn('Cannot check for updates - Electron API not available');
    }
  };

  const downloadUpdate = async () => {
    if (!updateInfo) return;
    
    if (window.electronAPI) {
      logger.info('Downloading update via Electron API');
      setDownloading(true);
      setDownloadProgress(0);
      
      try {
        await window.electronAPI.downloadUpdate();
      } catch (error) {
        logger.error('Failed to download update:', error);
        setDownloading(false);
      }
    } else {
      logger.warn('Cannot download update - Electron API not available');
    }
  };

  const installUpdate = async () => {
    if (window.electronAPI) {
      logger.info('Installing update via Electron API');
      setInstalling(true);
      
      try {
        await window.electronAPI.installUpdate();
        // The app will restart automatically after installation
      } catch (error) {
        logger.error('Failed to install update:', error);
        setInstalling(false);
      }
    } else {
      logger.warn('Cannot install update - Electron API not available');
    }
  };

  const dismissUpdate = () => {
    if (updateInfo?.mandatory) {
      logger.info('Cannot dismiss mandatory update');
      return;
    }
    
    logger.info('Dismissing update');
    setUpdateAvailable(false);
    setUpdateInfo(null);
    setDownloadProgress(0);
    setDownloading(false);
    setInstalling(false);
  };

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