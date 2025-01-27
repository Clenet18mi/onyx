// ============================================
// ONYX - MMKV Storage Configuration
// Stockage local ultra-rapide et sécurisé
// ============================================

import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Instance MMKV principale
export const storage = new MMKV({
  id: 'onyx-storage',
  encryptionKey: 'onyx-secure-key-2024',
});

// Adaptateur pour Zustand persist
export const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};

// ============================================
// Helpers pour accès direct
// ============================================
export const mmkvHelpers = {
  // String
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),
  
  // Number
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number): void => storage.set(key, value),
  
  // Boolean
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),
  
  // Object (JSON)
  getObject: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  },
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },
  
  // Delete
  delete: (key: string): void => storage.delete(key),
  
  // Clear all
  clearAll: (): void => storage.clearAll(),
  
  // Get all keys
  getAllKeys: (): string[] => storage.getAllKeys(),
};
