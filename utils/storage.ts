// ============================================
// ONYX - Storage Configuration
// AsyncStorage UNIQUEMENT pour la persistance des données.
// Garantit que les données restent après fermeture de l'app sur tous les appareils.
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

const ASYNC_STORAGE_PREFIX = 'onyx_storage_';

// Interface du stockage
export interface IStorage {
  initialize(): Promise<void>;
  getString(key: string): string | undefined;
  set(key: string, value: string | number): void | Promise<void>;
  getNumber(key: string): number | undefined;
  setNumber(key: string, value: number): void;
  getBoolean(key: string): boolean | undefined;
  setBoolean(key: string, value: boolean): void;
  delete(key: string): void | Promise<void>;
  getAllKeys(): string[];
  clearAll(): void | Promise<void>;
  flushPendingWrites?(): Promise<void>;
}

// ============================================
// Backend AsyncStorage (seul backend utilisé)
// ============================================

const cache: Record<string, string> = {};
const pendingWrites: Promise<void>[] = [];
const prefixed = (key: string) => `${ASYNC_STORAGE_PREFIX}${key}`;

function track<T>(p: Promise<T>): Promise<T> {
  pendingWrites.push(p as Promise<void>);
  p.finally(() => {
    const i = pendingWrites.indexOf(p as Promise<void>);
    if (i !== -1) pendingWrites.splice(i, 1);
  });
  return p;
}

let initialized = false;

// Objet storage exposé - 100% AsyncStorage
export const storage: IStorage = {
  async initialize() {
    if (initialized) return;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const onyxKeys = keys.filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX));
      for (const k of onyxKeys) {
        const v = await AsyncStorage.getItem(k);
        if (v != null) cache[k] = v;
      }
      initialized = true;
    } catch (e) {
      console.warn('[ONYX] Storage init failed', e);
      initialized = true;
    }
  },

  getString(key: string) {
    const v = cache[prefixed(key)];
    return v !== undefined ? v : undefined;
  },

  async set(key: string, value: string | number) {
    const k = prefixed(key);
    const str = typeof value === 'number' ? String(value) : value;
    cache[k] = str;
    await track(AsyncStorage.setItem(k, str));
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

  async delete(key: string) {
    const k = prefixed(key);
    delete cache[k];
    await track(AsyncStorage.removeItem(k));
  },

  getAllKeys() {
    return Object.keys(cache)
      .filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX))
      .map((k) => k.slice(ASYNC_STORAGE_PREFIX.length));
  },

  async clearAll() {
    const keys = Object.keys(cache).filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX));
    for (const k of keys) delete cache[k];
    await track(AsyncStorage.multiRemove(keys));
  },

  async flushPendingWrites() {
    await Promise.all([...pendingWrites]);
  },
};

/** À appeler quand l'app passe en arrière-plan. */
export async function flushPendingWrites(): Promise<void> {
  await storage.flushPendingWrites?.();
}

// ============================================
// Adapter Zustand - setItem retourne une Promise pour que la sauvegarde soit bien attendue
// ============================================

export const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): Promise<void> => {
    const p = storage.set(name, value);
    return p instanceof Promise ? p : Promise.resolve();
  },
  removeItem: (name: string): Promise<void> => {
    const p = storage.delete(name);
    return p instanceof Promise ? p : Promise.resolve();
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
