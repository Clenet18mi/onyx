// ============================================
// ONYX - Reminder Store
// Rappels personnalisés
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { Reminder } from '@/types/reminder';
import { useTransactionStore } from './transactionStore';

interface ReminderState {
  reminders: Reminder[];
  hasHydrated: boolean;
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  getUpcoming: (limit?: number) => Reminder[];
  /** Supprime les rappels dont transactionId ne correspond à aucune transaction existante */
  cleanOrphanReminders: () => void;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      reminders: [],
      hasHydrated: false,

      addReminder: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        set((state) => ({
          reminders: [...state.reminders, { ...data, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateReminder: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: now } : r
          ),
        }));
      },

      deleteReminder: (id) => {
        set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));
      },

      completeReminder: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, completed: true, completedAt: now, updatedAt: now } : r
          ),
        }));
      },

      getUpcoming: (limit = 10) => {
        const now = new Date().toISOString();
        return get().reminders
          .filter((r) => !r.completed && r.scheduledAt >= now)
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
          .slice(0, limit);
      },

      cleanOrphanReminders: () => {
        const reminders = get().reminders;
        const transactions = useTransactionStore.getState().transactions;
        const txIds = new Set(transactions.map((t) => t.id));
        const toRemove = reminders.filter(
          (r) => r.transactionId && !txIds.has(r.transactionId)
        );
        if (toRemove.length === 0) return;
        set((state) => ({
          reminders: state.reminders.filter((r) => !toRemove.some((o) => o.id === r.id)),
        }));
      },
    }),
    {
      name: 'onyx-reminders',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
