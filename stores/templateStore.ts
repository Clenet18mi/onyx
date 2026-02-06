// ============================================
// ONYX - Template Store
// Templates de transactions
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { TransactionTemplate } from '@/types/template';

interface TemplateState {
  templates: TransactionTemplate[];
  hasHydrated: boolean;
  addTemplate: (t: Omit<TransactionTemplate, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => string;
  updateTemplate: (id: string, updates: Partial<TransactionTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => TransactionTemplate | undefined;
  getTemplatesByType: (type: 'income' | 'expense') => TransactionTemplate[];
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      hasHydrated: false,

      addTemplate: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const order = Math.max(0, ...get().templates.map((t) => t.order)) + 1;
        set((state) => ({
          templates: [...state.templates, { ...data, id, createdAt: now, updatedAt: now, order }],
        }));
        return id;
      },

      updateTemplate: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: now } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
      },

      getTemplate: (id) => get().templates.find((t) => t.id === id),

      getTemplatesByType: (type) =>
        get().templates.filter((t) => t.type === type).sort((a, b) => a.order - b.order),
    }),
    {
      name: 'onyx-templates',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
