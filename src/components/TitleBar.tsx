import React from 'react';
import { Minus, Square, X, Settings } from 'lucide-react';
import { electronService } from '../services/electron.service';

interface TitleBarProps {
  onSettingsClick: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onSettingsClick }) => {
  const handleMinimize = () => {
    electronService.minimizeWindow();
  };

  const handleMaximize = () => {
    electronService.maximizeWindow();
  };

  const handleClose = () => {
    electronService.closeWindow();
  };

  return (
    <div className="bg-gray-900 text-white h-8 flex items-center justify-between px-4 select-none">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="ml-4 text-sm font-medium">ScreenCapture Pro</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={onSettingsClick}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-3 h-3" />
        </button>
        <button
          onClick={handleMinimize}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Minimize"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-red-600 rounded transition-colors"
          title="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};