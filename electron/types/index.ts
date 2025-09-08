export interface ElectronAPI {
  captureScreenshot: () => Promise<ScreenshotResult>;
  getScreenInfo: () => Promise<ScreenInfoResult>;
  onCaptureScreenshot: (callback: () => void) => void;
  onOpenSettings: (callback: () => void) => void;
  
  // Development functionality
  toggleDevTools: () => Promise<void>;
  isDevToolsOpen: () => Promise<boolean>;
  
  // HTTP proxy functionality
  proxyHttpRequest: (requestData: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  }) => Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    ok: boolean;
  }>;
  
  removeAllListeners: (channel: string) => void;
}

export interface ScreenshotResult {
  success: boolean;
  dataURL?: string;
  timestamp?: string;
  error?: string;
}

export interface ScreenInfoResult {
  success: boolean;
  displays?: DisplayInfo[];
  error?: string;
}

export interface DisplayInfo {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  isPrimary: boolean;
}

export interface AppConfig {
  window: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };
  screenshot: {
    defaultQuality: number;
    maxThumbnailSize: {
      width: number;
      height: number;
    };
  };
  paths: {
    userData: string;
    screenshots: string;
  };
}

export interface MenuTemplate {
  label: string;
  submenu: MenuItem[];
}

export interface MenuItem {
  label?: string;
  accelerator?: string;
  click?: () => void;
  role?: string;
  type?: 'separator';
  submenu?: MenuItem[];
}
