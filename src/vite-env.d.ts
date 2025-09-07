/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      // Screenshot functionality
      captureScreenshot: () => Promise<any>;
      getScreenInfo: () => Promise<any>;
      
      // Authentication functionality
      openAuthUrl: () => Promise<void>;
      onAuthSuccess: (callback: (event: any, userData: any) => void) => void;
      
      // App events
      onCaptureScreenshot: (callback: (event: any) => void) => void;
      onOpenSettings: (callback: (event: any) => void) => void;
      onToggleTracking: (callback: (event: any) => void) => void;
      
      // Remove listeners
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {};
