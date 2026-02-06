// ============================================
// ONYX - Split Store
// Partage de dépense (Split Bill)
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { SplitBill, SplitParticipant } from '@/types/split';

interface SplitState {
  splits: SplitBill[];
  hasHydrated: boolean;
  createSplit: (transactionId: string, totalAmount: number, participantNames: string[], mode?: 'equal' | 'custom') => string;
  updateParticipantAmount: (splitId: string, participantId: string, amount: number) => void;
  markPaid: (splitId: string, participantId: string) => void;
  deleteSplit: (id: string) => void;
  getSplitsByTransaction: (transactionId: string) => SplitBill | undefined;
}

export const useSplitStore = create<SplitState>()(
  persist(
    (set, get) => ({
      splits: [],
      hasHydrated: false,

      createSplit: (transactionId, totalAmount, participantNames, mode = 'equal') => {
        const id = generateId();
        const now = new Date().toISOString();
        const count = participantNames.length;
        const amountEach = count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0;
        const participants: SplitParticipant[] = participantNames.map((name, i) => ({
          id: generateId(),
          name: name.trim() || `Personne ${i + 1}`,
          amount: amountEach,
          paid: false,
        }));
        set((state) => ({
          splits: [...state.splits, { id, transactionId, totalAmount, mode: mode || 'equal', participants, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateParticipantAmount: (splitId, participantId, amount) => {
        const now = new Date().toISOString();
        set((state) => ({
          splits: state.splits.map((s) =>
            s.id === splitId
              ? {
                  ...s,
                  updatedAt: now,
                  participants: s.participants.map((p) =>
                    p.id === participantId ? { ...p, amount } : p
                  ),
                }
              : s
          ),
        }));
      },

      markPaid: (splitId, participantId) => {
        const now = new Date().toISOString();
        set((state) => ({
          splits: state.splits.map((s) =>
            s.id === splitId
              ? {
                  ...s,
                  updatedAt: now,
                  participants: s.participants.map((p) =>
                    p.id === participantId ? { ...p, paid: true, paidAt: now } : p
                  ),
                }
              : s
          ),
        }));
      },

      deleteSplit: (id) => {
        set((state) => ({ splits: state.splits.filter((s) => s.id !== id) }));
      },

      getSplitsByTransaction: (transactionId) =>
        get().splits.find((s) => s.transactionId === transactionId),
    }),
    {
      name: 'onyx-splits',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
