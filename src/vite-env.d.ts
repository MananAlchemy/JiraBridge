/// <reference types="vite/client" />
/// <reference path="../electron/types/index.ts" />

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
