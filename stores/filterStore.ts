// ============================================
// ONYX - Filter Store
// Filtres sauvegardés pour les transactions
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { SavedFilter } from '@/types/filter';

interface FilterState {
  savedFilters: SavedFilter[];
  /** Filtre actuellement appliqué (pour la liste des transactions) */
  activeFilter: Partial<SavedFilter> | null;
  setActiveFilter: (f: Partial<SavedFilter> | null) => void;
  addFilter: (filter: Omit<SavedFilter, 'id' | 'createdAt'>) => string;
  updateFilter: (id: string, updates: Partial<SavedFilter>) => void;
  deleteFilter: (id: string) => void;
  getFilter: (id: string) => SavedFilter | undefined;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      savedFilters: [],
      activeFilter: null,
      setActiveFilter: (f) => set({ activeFilter: f }),

      addFilter: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        set((state) => ({
          savedFilters: [...state.savedFilters, { ...data, id, createdAt: now }],
        }));
        return id;
      },

      updateFilter: (id, updates) => {
        set((state) => ({
          savedFilters: state.savedFilters.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteFilter: (id) => {
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.id !== id),
        }));
      },

      getFilter: (id) => get().savedFilters.find((f) => f.id === id),
    }),
    { name: 'onyx-filters', storage: createJSONStorage(() => zustandStorage) }
  )
);
