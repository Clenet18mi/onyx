// ============================================
// ONYX - Automation Store
// Règles SI... ALORS...
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { AutomationRule, RuleExecutionLog } from '@/types/automation';

interface AutomationState {
  rules: AutomationRule[];
  logs: RuleExecutionLog[];
  hasHydrated: boolean;
  addRule: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateRule: (id: string, updates: Partial<AutomationRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  getRule: (id: string) => AutomationRule | undefined;
  addLog: (log: Omit<RuleExecutionLog, 'id'>) => void;
  clearLogs: () => void;
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      rules: [],
      logs: [],
      hasHydrated: false,

      addRule: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        set((state) => ({
          rules: [...state.rules, { ...data, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateRule: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: now } : r
          ),
        }));
      },

      deleteRule: (id) => {
        set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }));
      },

      toggleRule: (id) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      getRule: (id) => get().rules.find((r) => r.id === id),

      addLog: (data) => {
        const id = generateId();
        set((state) => ({
          logs: [...state.logs.slice(-99), { ...data, id }],
        }));
      },

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'onyx-automation',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
