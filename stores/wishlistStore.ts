// ============================================
// ONYX - Wishlist Store
// Liste d'envies
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { WishlistItem } from '@/types/wishlist';

interface WishlistState {
  items: WishlistItem[];
  hasHydrated: boolean;
  addItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteItem: (id: string) => void;
  markPurchased: (id: string, at?: string) => void;
  getTotalValue: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      addItem: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        set((state) => ({
          items: [...state.items, { ...data, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateItem: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: now } : i
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      markPurchased: (id, at) => {
        const now = at || new Date().toISOString();
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, purchasedAt: now, updatedAt: now } : i
          ),
        }));
      },

      getTotalValue: () =>
        get().items.filter((i) => !i.purchasedAt).reduce((s, i) => s + i.price, 0),
    }),
    {
      name: 'onyx-wishlist',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
