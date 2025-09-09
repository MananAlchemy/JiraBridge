import { AppConfig } from '../types';
import { app } from 'electron';
import path from 'path';

export const APP_CONFIG: AppConfig = {
  window: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
  },
  screenshot: {
    defaultQuality: 80,
    maxThumbnailSize: {
      width: 1920,
      height: 1080,
    },
  },
  paths: {
    userData: app.getPath('userData'),
    screenshots: path.join(app.getPath('userData'), 'screenshots'),
  },
};

export const APP_CONSTANTS = {
  APP_NAME: process.env.VITE_APP_NAME || 'JiraBridge',
  APP_ID: process.env.VITE_APP_ID || 'com.mananalchemy.jirabridge',
  VERSION: process.env.VITE_APP_VERSION || '1.0.0',
  DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173',
  IPC_CHANNELS: {
    CAPTURE_SCREENSHOT: 'capture-screenshot',
    GET_SCREEN_INFO: 'get-screen-info',
    OPEN_SETTINGS: 'open-settings',
  },
  KEYBOARD_SHORTCUTS: {
    CAPTURE_SCREENSHOT: 'CmdOrCtrl+Shift+S',
    OPEN_SETTINGS: 'CmdOrCtrl+,',
    QUIT_APP: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
  },
} as const;
