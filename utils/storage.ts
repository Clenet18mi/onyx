// ============================================
// ONYX - Storage Configuration
// MMKV en priorité, fallback AsyncStorage si MMKV plante (ex: certains appareils)
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

const ASYNC_STORAGE_PREFIX = 'onyx_storage_';

// Interface unifiée pour les deux backends
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

// ============================================
// Backend AsyncStorage (fallback)
// Cache en mémoire pour accès synchrone après initialize()
// ============================================

function createAsyncStorageBackend(): IStorage {
  const cache: Record<string, string> = {};
  const prefixed = (key: string) => `${ASYNC_STORAGE_PREFIX}${key}`;

  return {
    async initialize() {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const onyxKeys = keys.filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX));
        if (onyxKeys.length === 0) return;
        const pairs = await AsyncStorage.multiGet(onyxKeys);
        for (const [k, v] of pairs) {
          if (v != null) cache[k] = v;
        }
      } catch (e) {
        console.warn('[ONYX] AsyncStorage init failed', e);
      }
    },

    getString(key: string) {
      const v = cache[prefixed(key)];
      return v !== undefined ? v : undefined;
    },

    set(key: string, value: string | number) {
      const k = prefixed(key);
      const str = typeof value === 'number' ? String(value) : value;
      cache[k] = str;
      AsyncStorage.setItem(k, str).catch(() => {});
    },

    getNumber(key: string) {
      const v = cache[prefixed(key)];
      if (v === undefined) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    },

    setNumber(key: string, value: number) {
      this.set(key, String(value));
    },

    getBoolean(key: string) {
      const v = cache[prefixed(key)];
      if (v === undefined) return undefined;
      return v === 'true';
    },

    setBoolean(key: string, value: boolean) {
      this.set(key, value ? 'true' : 'false');
    },

    delete(key: string) {
      const k = prefixed(key);
      delete cache[k];
      AsyncStorage.removeItem(k).catch(() => {});
    },

    getAllKeys() {
      return Object.keys(cache)
        .filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX))
        .map((k) => k.slice(ASYNC_STORAGE_PREFIX.length));
    },

    clearAll() {
      const keys = Object.keys(cache).filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX));
      for (const k of keys) delete cache[k];
      AsyncStorage.multiRemove(keys).catch(() => {});
    },
  };
}

// ============================================
// Backend MMKV (principal)
// ============================================

function createMMKVBackend(): IStorage | null {
  try {
    const { MMKV } = require('react-native-mmkv');
    const inst = new MMKV({
      id: 'onyx-storage',
      encryptionKey: 'onyx-secure-key-2024',
    });
    return {
      async initialize() {},
      getString(key: string) {
        const v = inst.getString(key);
        return v !== undefined ? v : undefined;
      },
      set(key: string, value: string) {
        inst.set(key, value);
      },
      getNumber(key: string) {
        const v = inst.getNumber(key);
        return v !== undefined ? v : undefined;
      },
      setNumber(key: string, value: number) {
        inst.set(key, value);
      },
      getBoolean(key: string) {
        const v = inst.getBoolean(key);
        return v !== undefined ? v : undefined;
      },
      setBoolean(key: string, value: boolean) {
        inst.set(key, value);
      },
      delete(key: string) {
        inst.delete(key);
      },
      getAllKeys() {
        return inst.getAllKeys();
      },
      clearAll() {
        inst.clearAll();
      },
    };
  } catch (e) {
    console.warn('[ONYX] MMKV failed, using AsyncStorage fallback', e);
    return null;
  }
}

// ============================================
// Instance unique : MMKV ou fallback AsyncStorage
// ============================================

let backend: IStorage;

try {
  const MMKV = require('react-native-mmkv').MMKV;
  const inst = new MMKV({
    id: 'onyx-storage',
    encryptionKey: 'onyx-secure-key-2024',
  });
  backend = {
    async initialize() {},
    getString(key: string) {
      const v = inst.getString(key);
      return v !== undefined ? v : undefined;
    },
    set(key: string, value: string | number) {
      if (typeof value === 'number') inst.set(key, value);
      else inst.set(key, value);
    },
    getNumber(key: string) {
      const v = inst.getNumber(key);
      return v !== undefined ? v : undefined;
    },
    setNumber(key: string, value: number) {
      inst.set(key, value);
    },
    getBoolean(key: string) {
      const v = inst.getBoolean(key);
      return v !== undefined ? v : undefined;
    },
    setBoolean(key: string, value: boolean) {
      inst.set(key, value);
    },
    delete(key: string) {
      inst.delete(key);
    },
    getAllKeys() {
      return inst.getAllKeys();
    },
    clearAll() {
      inst.clearAll();
    },
  };
} catch {
  backend = createAsyncStorageBackend();
}

// Objet storage exposé (API synchrone après initialize)
export const storage: IStorage = {
  initialize: () => backend.initialize(),
  getString: (k) => backend.getString(k),
  set: (k, v) => backend.set(k, v),
  getNumber: (k) => backend.getNumber(k),
  setNumber: (k, v) => backend.setNumber(k, v),
  getBoolean: (k) => backend.getBoolean(k),
  setBoolean: (k, v) => backend.setBoolean(k, v),
  delete: (k) => backend.delete(k),
  getAllKeys: () => backend.getAllKeys(),
  clearAll: () => backend.clearAll(),
};

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
  setNumber: (key: string, value: number) => storage.setNumber(key, value),
  getBoolean: (key: string) => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean) => storage.setBoolean(key, value),
  delete: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),
};
