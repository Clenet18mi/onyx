// ============================================
// ONYX - Storage Configuration
// MMKV pour les builds natifs (APK)
// ============================================

import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// ============================================
// Instance MMKV principale
// Stockage local rapide et sécurisé
// ============================================

export const storage = new MMKV({
  id: 'onyx-storage',
  encryptionKey: 'onyx-secure-key-2024',
});

// ============================================
// Adapter Zustand pour persistence
// ============================================

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
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getNumber: (key: string) => storage.getNumber(key),
  setNumber: (key: string, value: number) => storage.set(key, value),
  getBoolean: (key: string) => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean) => storage.set(key, value),
  delete: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),
};
