// ============================================
// ONYX - Reminder Store
// Rappels personnalisés
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { Reminder } from '@/types/reminder';

interface ReminderState {
  reminders: Reminder[];
  hasHydrated: boolean;
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  getUpcoming: (limit?: number) => Reminder[];
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
