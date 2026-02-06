// ============================================
// ONYX - Stockage avec AsyncStorage (React Native)
// Fiable, pas de dépendance JSI, tout est persisté sur le disque.
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

const PREFIX = '@onyx_';

// --------------------------------------------
// Adapter pour Zustand persist (async)
// --------------------------------------------

export const zustandStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const key = PREFIX + name;
      const value = await AsyncStorage.getItem(key);
      return value ?? null;
    } catch (error) {
      console.error(`[ONYX] Storage getItem ${name}:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const key = PREFIX + name;
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`[ONYX] Storage setItem ${name}:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const key = PREFIX + name;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[ONYX] Storage removeItem ${name}:`, error);
    }
  },
};

// --------------------------------------------
// API storage pour migrations et composants (async)
// Les clés Zustand sont préfixées ; pour cohérence on utilise le même préfixe.
// --------------------------------------------

function key(k: string): string {
  return k.startsWith(PREFIX) ? k : PREFIX + k;
}

export const storage = {
  async getString(name: string): Promise<string | undefined> {
    const value = await AsyncStorage.getItem(key(name));
    return value ?? undefined;
  },
  async set(name: string, value: string | number): Promise<void> {
    await AsyncStorage.setItem(key(name), typeof value === 'number' ? String(value) : value);
  },
  async getNumber(name: string): Promise<number | undefined> {
    const v = await AsyncStorage.getItem(key(name));
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  },
  async getAllKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter((k) => k.startsWith(PREFIX)).map((k) => k.replace(PREFIX, ''));
  },
  async delete(name: string): Promise<void> {
    await AsyncStorage.removeItem(key(name));
  },
  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const onyxKeys = keys.filter((k) => k.startsWith(PREFIX));
    if (onyxKeys.length > 0) {
      await AsyncStorage.multiRemove(onyxKeys);
    }
  },
};

// Compatibilité noms de clés : les stores Zustand utilisent 'onyx-auth', 'onyx-accounts', etc.
// On stocke avec la clé telle quelle (PREFIX + 'onyx-auth' = '@onyx_onyx-auth').
// Pas de changement côté stores : createJSONStorage(() => zustandStorage) envoie 'onyx-auth', on préfixe dans zustandStorage.

export const storageHelper = {
  async initialize(): Promise<void> {
    return Promise.resolve();
  },
};

