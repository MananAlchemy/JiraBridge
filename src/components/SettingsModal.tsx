import React, { useState } from 'react';
import { X, Save, Monitor, Clock, Wifi, Image, Cloud } from 'lucide-react';
import { AppSettings } from '../types';
import { useFirebaseConfig } from '../hooks/useFirebaseConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const { config: firebaseConfig, isInitialized: firebaseInitialized, isLoading: firebaseLoading } = useFirebaseConfig();

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-medium text-gray-900">Screenshot Interval</h3>
              {firebaseInitialized && (
                <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Cloud className={`w-3 h-3 ${firebaseLoading ? 'animate-pulse' : ''}`} />
                  <span>{firebaseLoading ? 'Syncing...' : 'Remote'}</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Screenshot interval is controlled remotely via Firebase
              </p>
              {firebaseInitialized && (
                <p className="text-sm font-medium text-gray-900 mt-1">
                  Current interval: {firebaseConfig.screenshotInterval} seconds
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Image className="w-5 h-5 text-indigo-600" />
              <h3 className="font-medium text-gray-900">Screenshot Quality</h3>
            </div>
            <select
              value={localSettings.screenshotQuality}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                screenshotQuality: e.target.value as 'low' | 'medium' | 'high'
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="low">Low (Faster, smaller files)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Best quality, larger files)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Monitor className="w-5 h-5 text-indigo-600" />
              <h3 className="font-medium text-gray-900">Auto Updates</h3>
              {firebaseInitialized && (
                <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Cloud className={`w-3 h-3 ${firebaseLoading ? 'animate-pulse' : ''}`} />
                  <span>{firebaseLoading ? 'Syncing...' : 'Remote'}</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Auto updates are controlled remotely via Firebase
              </p>
              {firebaseInitialized && (
                <p className="text-sm font-medium text-gray-900 mt-1">
                  Status: {firebaseConfig.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Wifi className="w-5 h-5 text-indigo-600" />
              <h3 className="font-medium text-gray-900">Sync Settings</h3>
              {firebaseInitialized && (
                <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Cloud className={`w-3 h-3 ${firebaseLoading ? 'animate-pulse' : ''}`} />
                  <span>{firebaseLoading ? 'Syncing...' : 'Remote'}</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Sync settings are controlled remotely via Firebase
              </p>
              {firebaseInitialized && (
                <p className="text-sm font-medium text-gray-900 mt-1">
                  Status: {firebaseConfig.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};