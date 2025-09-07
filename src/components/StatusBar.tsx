import React from 'react';
import { Wifi, WifiOff, Camera, Clock, User, Image, RefreshCw, HardDrive } from 'lucide-react';
import { User as UserType, Screenshot } from '../types';

interface StatusBarProps {
  user: UserType;
  isOnline: boolean;
  lastCapture: Date | null;
  isCapturing: boolean;
  isTracking?: boolean;
  totalTimeToday?: string;
  screenshots: Screenshot[];
  unsyncedCount: number;
  isSyncing: boolean;
  onSignOut: () => void;
  onSync: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  user,
  isOnline,
  lastCapture,
  isCapturing,
  isTracking = false,
  totalTimeToday = '0s',
  screenshots,
  unsyncedCount,
  isSyncing,
  onSignOut,
  onSync
}) => {
  const formatLastCapture = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between z-40 shadow-lg">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm text-gray-600">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Camera className={`w-4 h-4 ${isCapturing ? 'text-blue-500' : 'text-gray-400'}`} />
            {isCapturing && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <span className="text-sm text-gray-600">
            Last: {formatLastCapture(lastCapture)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className={`w-4 h-4 ${isTracking ? 'text-green-500' : 'text-gray-400'}`} />
          <span className="text-sm text-gray-600">
            Today: {totalTimeToday}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Image className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-gray-600">
            Screenshots: {screenshots.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Size: {formatFileSize(screenshots.reduce((sum, s) => sum + s.size, 0))}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onSync}
            disabled={isSyncing || unsyncedCount === 0}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing ? 'Syncing...' : `Sync (${unsyncedCount})`}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <User className="w-4 h-4 text-gray-400" />
          )}
          <div className="flex flex-col">
            <span className="text-sm text-gray-700 font-medium">{user.name}</span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
        </div>
        
        <button
          onClick={onSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};