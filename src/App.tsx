import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { MainDashboard } from './components/MainDashboard';
import { UpdateModal } from './components/UpdateModal';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatIcon } from './components/ChatIcon';
import { useAuth } from './hooks/useAuth';
import { useUpdates } from './hooks/useUpdates';
import { useFirebaseConfig } from './hooks/useFirebaseConfig';
import { AppSettings } from './types';
import { storage } from './utils/storage';
import { logger } from './utils/logger';
import { APP_CONSTANTS } from './constants';

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const {
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    installing,
    downloadUpdate,
    installUpdate,
    dismissUpdate
  } = useUpdates();
  const { config: firebaseConfig, isInitialized: firebaseInitialized } = useFirebaseConfig();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    screenshotInterval: APP_CONSTANTS.SCREENSHOT.DEFAULT_INTERVAL,
    autoUpdate: true,
    syncOnline: true,
    screenshotQuality: 'medium',
    autoSync: true,
    notifications: true,
    theme: 'system',
    language: 'en',
    maxScreenshots: APP_CONSTANTS.SCREENSHOT.MAX_COUNT,
    compressionLevel: 80,
    isTracking: false,
  });

  const [timeTrackingData, setTimeTrackingData] = useState({
    isTracking: false,
    totalTimeToday: '0s',
    lastCapture: null as Date | null,
    isCapturing: false
  });

  const [screenshotsData, setScreenshotsData] = useState({
    screenshots: [] as any[],
    unsyncedCount: 0,
    failedUploadsCount: 0,
    isSyncing: false
  });

  const handleScreenshotsUpdate = (data: { screenshots: any[]; unsyncedCount: number; failedUploadsCount: number; isSyncing: boolean }) => {
    setScreenshotsData(data);
  };

  const [syncTrigger, setSyncTrigger] = useState(0);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const handleSync = async () => {
    // Trigger sync by updating the trigger state
    setSyncTrigger(prev => prev + 1);
  };

  const handleRetryFailedUploads = async () => {
    // Trigger retry by updating the retry trigger state
    setRetryTrigger(prev => prev + 1);
  };

  // Update settings when Firebase config changes
  useEffect(() => {
    if (firebaseInitialized) {
      setSettings(prevSettings => {
        const newSettings = {
          ...prevSettings,
          screenshotInterval: firebaseConfig.screenshotInterval,
          screenshotQuality: firebaseConfig.screenshotQuality,
          maxScreenshots: firebaseConfig.maxScreenshots,
          autoSync: firebaseConfig.autoSyncEnabled,
          notifications: firebaseConfig.notificationsEnabled,
        };
        
        // Log when screenshot interval changes
        if (prevSettings.screenshotInterval !== firebaseConfig.screenshotInterval) {
          logger.info('Screenshot interval updated from Firebase Remote Config:', {
            old: prevSettings.screenshotInterval,
            new: firebaseConfig.screenshotInterval
          });
        }
        
        logger.info('Settings updated from Firebase Remote Config:', firebaseConfig);
        return newSettings;
      });
    }
  }, [firebaseInitialized, firebaseConfig]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load settings from storage
    loadSettings();

    // Get and log machine ID
    const logMachineId = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getMachineId) {
          const result = await window.electronAPI.getMachineId();
          if (result.success) {
            console.log('🖥️  Machine ID:', result.machineId);
            logger.info('Machine ID retrieved:', result.machineId);
          } else {
            console.error('❌ Failed to get machine ID:', result.error);
            logger.error('Failed to get machine ID:', result.error);
          }
        } else {
          console.log('🖥️  Running in web mode - machine ID not available');
          logger.info('Running in web mode - machine ID not available');
        }
      } catch (error) {
        console.error('❌ Error getting machine ID:', error);
        logger.error('Error getting machine ID:', error);
      }
    };

    logMachineId();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = storage.get<AppSettings>(APP_CONSTANTS.STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        setSettings(prevSettings => ({ ...prevSettings, ...savedSettings }));
        logger.info('Settings loaded from storage');
      }
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    try {
      setSettings(newSettings);
      storage.set(APP_CONSTANTS.STORAGE_KEYS.SETTINGS, newSettings);
      logger.info('Settings saved to storage');
    } catch (error) {
      logger.error('Failed to save settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onGoogleSignIn={signInWithGoogle} loading={loading} />;
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 pb-16">
          <MainDashboard
            onSettingsClick={() => setShowSettings(true)}
            settings={settings}
            onTimeTrackingUpdate={setTimeTrackingData}
            onScreenshotsUpdate={handleScreenshotsUpdate}
            syncTrigger={syncTrigger}
            retryTrigger={retryTrigger}
          />
        </div>
        
        <StatusBar
          user={user}
          isOnline={isOnline}
          lastCapture={timeTrackingData.lastCapture}
          isCapturing={timeTrackingData.isCapturing}
          isTracking={timeTrackingData.isTracking}
          totalTimeToday={timeTrackingData.totalTimeToday}
          screenshots={screenshotsData.screenshots}
          unsyncedCount={screenshotsData.unsyncedCount}
          failedUploadsCount={screenshotsData.failedUploadsCount}
          isSyncing={screenshotsData.isSyncing}
          onSignOut={signOut}
          onSync={handleSync}
          onRetryFailedUploads={handleRetryFailedUploads}
        />

        {updateAvailable && updateInfo && (
          <UpdateModal
            updateInfo={updateInfo}
            downloading={downloading}
            downloadProgress={downloadProgress}
            installing={installing}
            onDownload={downloadUpdate}
            onInstall={installUpdate}
            onDismiss={dismissUpdate}
          />
        )}

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSave={handleSaveSettings}
        />

        {/* Floating Chat Icon - Only show when user is logged in */}
        {user && (
          <ChatIcon
            onChatOpen={() => logger.info('Chat opened')}
            onChatClose={() => logger.info('Chat closed')}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;