// ============================================
// ONYX - Storage Configuration
// MMKV pour la persistance des données (synchrone et performant)
// Garantit que les données restent après fermeture de l'app sur tous les appareils.
// ============================================

import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Instance MMKV unique — initialisation paresseuse pour éviter le crash
// "MMKV can only be used when JSI is possible" (au chargement du module JSI n'est pas encore prêt)
let storage: MMKV | null = null;

function getStorage(): MMKV {
  if (storage != null) return storage;
  try {
    storage = new MMKV({ id: 'onyx-storage' });
  } catch (error) {
    console.warn('[ONYX] MMKV init with id failed, using default:', error);
    try {
      storage = new MMKV();
    } catch (e) {
      console.error('[ONYX] MMKV init failed:', e);
      throw e;
    }
  }
  return storage;
}

const RETRY_DELAY_MS = 150;
const RETRY_MAX = 40; // ~6 secondes max

/**
 * Initialise MMKV en réessayant jusqu'à ce que JSI soit prêt.
 * À appeler au démarrage avant toute lecture/écriture.
 */
export function ensureStorageReady(): Promise<void> {
  if (storage != null) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryInit = () => {
      attempts++;
      try {
        getStorage();
        resolve();
      } catch (e) {
        if (attempts >= RETRY_MAX) {
          console.error('[ONYX] MMKV init failed after retries:', e);
          reject(e);
          return;
        }
        setTimeout(tryInit, RETRY_DELAY_MS);
      }
    };
    tryInit();
  });
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
    return getStorage().getString(key);
  },

  set(key: string, value: string | number) {
    if (typeof value === 'number') {
      getStorage().set(key, value);
    } else {
      getStorage().set(key, value);
    }
  },

  getNumber(key: string) {
    return getStorage().getNumber(key);
  },

  setNumber(key: string, value: number) {
    getStorage().set(key, value);
  },

  getBoolean(key: string) {
    return getStorage().getBoolean(key);
  },

  setBoolean(key: string, value: boolean) {
    getStorage().set(key, value);
  },

  delete(key: string) {
    getStorage().delete(key);
  },

  getAllKeys() {
    return getStorage().getAllKeys();
  },

  clearAll() {
    getStorage().clearAll();
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
      const value = getStorage().getString(name);
      return value ?? null;
    } catch (error) {
      console.error(`[ONYX] Error getting item ${name}:`, error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      getStorage().set(name, value);
    } catch (error) {
      console.error(`[ONYX] Error setting item ${name}:`, error);
    }
  },
  removeItem: (name: string): void => {
    try {
      getStorage().delete(name);
    } catch (error) {
      console.error(`[ONYX] Error removing item ${name}:`, error);
    }
  },
};

// ============================================
// Helpers
// ============================================

export const mmkvHelpers = {
  getString: (key: string) => getStorage().getString(key),
  setString: (key: string, value: string) => getStorage().set(key, value),
  getNumber: (key: string) => getStorage().getNumber(key),
  setNumber: (key: string, value: number) => getStorage().setNumber(key, value),
  getBoolean: (key: string) => getStorage().getBoolean(key),
  setBoolean: (key: string, value: boolean) => getStorage().setBoolean(key, value),
  delete: (key: string) => getStorage().delete(key),
  clearAll: () => getStorage().clearAll(),
};
