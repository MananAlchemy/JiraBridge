import { ScreenshotQuality } from '../constants';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Screenshot {
  id: string;
  timestamp: Date;
  filename: string;
  size: number;
  synced: boolean;
  dataURL?: string; // Base64 encoded image data
  quality: ScreenshotQuality;
  displayId?: number; // Which display was captured
  tags?: string[];
  description?: string;
}

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  mandatory: boolean;
  releaseDate: Date;
  size: number;
}

export interface AppSettings {
  screenshotInterval: number; // seconds
  autoUpdate: boolean;
  syncOnline: boolean;
  screenshotQuality: ScreenshotQuality;
  autoSync: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  maxScreenshots: number;
  compressionLevel: number; // 0-100
  isTracking: boolean; // Whether time tracking is active
}

export interface TimeTrackingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  screenshots: string[]; // screenshot IDs
  isActive: boolean;
}

export interface DailyTimeTracking {
  date: string; // YYYY-MM-DD format
  totalTime: number; // in milliseconds
  sessions: TimeTrackingSession[];
  screenshotCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt?: Date;
  pendingCount: number;
  error?: string;
}

export interface AppState {
  isLoading: boolean;
  error?: string;
  lastActivity: Date;
}

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
}

export interface DisplayInfo {
  id: number;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  isPrimary: boolean;
  rotation: number;
}

export interface CaptureOptions {
  quality: ScreenshotQuality;
  displayId?: number;
  includeCursor?: boolean;
  delay?: number; // milliseconds
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number; // 0-100
  includeMetadata: boolean;
  compressionLevel: number; // 0-9
}