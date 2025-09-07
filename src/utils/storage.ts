import { logger } from './logger';

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      return JSON.parse(item);
    } catch (error) {
      logger.error('Failed to get item from storage:', { key, error });
      return defaultValue || null;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      logger.debug('Item saved to storage:', { key });
      return true;
    } catch (error) {
      logger.error('Failed to save item to storage:', { key, error });
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      logger.debug('Item removed from storage:', { key });
      return true;
    } catch (error) {
      logger.error('Failed to remove item from storage:', { key, error });
      return false;
    }
  }

  clear(): boolean {
    try {
      localStorage.clear();
      logger.info('Storage cleared');
      return true;
    } catch (error) {
      logger.error('Failed to clear storage:', error);
      return false;
    }
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  getKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }

  getSize(): number {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }
    return size;
  }
}

export const storage = StorageManager.getInstance();
