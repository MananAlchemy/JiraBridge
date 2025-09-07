import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { MainDashboard } from './components/MainDashboard';
import { UpdateModal } from './components/UpdateModal';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { useUpdates } from './hooks/useUpdates';
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
    isSyncing: false
  });

  const handleScreenshotsUpdate = (data: { screenshots: any[]; unsyncedCount: number; isSyncing: boolean }) => {
    setScreenshotsData(data);
  };

  const [syncTrigger, setSyncTrigger] = useState(0);

  const handleSync = async () => {
    // Trigger sync by updating the trigger state
    setSyncTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load settings from storage
    loadSettings();

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
          isSyncing={screenshotsData.isSyncing}
          onSignOut={signOut}
          onSync={handleSync}
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
      </div>
    </ErrorBoundary>
  );
}

export default App;