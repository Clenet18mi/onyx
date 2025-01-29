// ============================================
// ONYX - Settings Store
// Paramètres de l'application
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { Settings } from '@/types';

interface SettingsState extends Settings {
  // Actions
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
  toggleHaptic: () => void;
  setCurrency: (currency: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

const defaultSettings: Settings = {
  currency: 'EUR',
  locale: 'fr-FR',
  theme: 'dark',
  hapticEnabled: true,
  notificationsEnabled: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSettings: (newSettings) => {
        set((state) => ({ ...state, ...newSettings }));
      },

      resetSettings: () => {
        set(defaultSettings);
      },

      toggleHaptic: () => {
        set((state) => ({ hapticEnabled: !state.hapticEnabled }));
      },

      setCurrency: (currency) => {
        set({ currency });
      },

      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: 'onyx-settings',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
