// ============================================
// ONYX - Storage Configuration
// MMKV pour la persistance des données (synchrone et performant)
// Garantit que les données restent après fermeture de l'app sur tous les appareils.
// ============================================

import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Instance MMKV unique pour toute l'application
// Protégé avec try-catch pour éviter les crashes au démarrage
let storage: MMKV;
try {
  storage = new MMKV({
    id: 'onyx-storage',
  });
} catch (error) {
  console.error('[ONYX] Failed to initialize MMKV:', error);
  // Fallback: créer une instance par défaut
  storage = new MMKV();
}

// Interface du stockage (compatibilité)
export interface IStorage {
  initialize(): Promise<void>;
  getString(key: string): string | undefined;
  set(key: string, value: string | number): void;
  getNumber(key: string): number | undefined;
  setNumber(key: string, value: number): void;
  getBoolean(key: string): boolean | undefined;
  setBoolean(key: string, value: boolean): void;
  delete(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
}

// Objet storage exposé - 100% MMKV (synchrone)
export const storageHelper: IStorage = {
  async initialize() {
    // MMKV est immédiatement disponible, pas besoin d'initialisation asynchrone
    return Promise.resolve();
  },

  getString(key: string) {
    return storage.getString(key);
  },

  set(key: string, value: string | number) {
    if (typeof value === 'number') {
      storage.set(key, value);
    } else {
      storage.set(key, value);
    }
  },

  getNumber(key: string) {
    return storage.getNumber(key);
  },

  setNumber(key: string, value: number) {
    storage.set(key, value);
  },

  getBoolean(key: string) {
    return storage.getBoolean(key);
  },

  setBoolean(key: string, value: boolean) {
    storage.set(key, value);
  },

  delete(key: string) {
    storage.delete(key);
  },

  getAllKeys() {
    return storage.getAllKeys();
  },

  clearAll() {
    storage.clearAll();
  },
};

/** À appeler quand l'app passe en arrière-plan (compatibilité) */
export async function flushPendingWrites(): Promise<void> {
  // MMKV est synchrone, pas besoin d'attendre
  return Promise.resolve();
}

// Sauvegarde immédiate à chaque action (enregistrée par persistStores)
let onPersistNow: (() => Promise<void>) | null = null;
export function registerPersistNow(callback: () => Promise<void>): void {
  onPersistNow = callback;
}
/** À appeler après CHAQUE action (création compte, virement, etc.) pour sauvegarder tout sur le disque. */
export function persistNow(): void {
  if (onPersistNow) onPersistNow().catch(() => {});
}

// ============================================
// Adaptateur Zustand - MMKV est synchrone
// ============================================

export const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const value = storage.getString(name);
      return value ?? null;
    } catch (error) {
      console.error(`[ONYX] Error getting item ${name}:`, error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      storage.set(name, value);
    } catch (error) {
      console.error(`[ONYX] Error setting item ${name}:`, error);
    }
  },
  removeItem: (name: string): void => {
    try {
      storage.delete(name);
    } catch (error) {
      console.error(`[ONYX] Error removing item ${name}:`, error);
    }
  },
};

// ============================================
// Helpers
// ============================================

export const mmkvHelpers = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getNumber: (key: string) => storage.getNumber(key),
  setNumber: (key: string, value: number) => storage.setNumber(key, value),
  getBoolean: (key: string) => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean) => storage.setBoolean(key, value),
  delete: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),
};
