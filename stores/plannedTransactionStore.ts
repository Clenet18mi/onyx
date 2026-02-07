// ============================================
// ONYX - Planned Transaction Store
// Dépenses / revenus prévus (futurs)
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { PlannedTransaction, PlannedTransactionRecurrence } from '@/types';
import { generateId } from '@/utils/crypto';
import { useTransactionStore } from './transactionStore';
import { addDays, addWeeks, addMonths, addYears, parseISO, startOfDay, isBefore, isAfter, differenceInDays } from 'date-fns';

interface PlannedTransactionState {
  plannedTransactions: PlannedTransaction[];
  hasHydrated: boolean;

  addPlannedTransaction: (data: Omit<PlannedTransaction, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string;
  updatePlannedTransaction: (id: string, updates: Partial<PlannedTransaction>) => void;
  deletePlannedTransaction: (id: string) => void;
  realizePlannedTransaction: (id: string, actualDate?: string) => string | null;
  cancelPlannedTransaction: (id: string) => void;

  getUpcoming: (days?: number) => PlannedTransaction[];
  getPending: () => PlannedTransaction[];
  getByAccount: (accountId: string) => PlannedTransaction[];
  getOverdue: () => PlannedTransaction[];

  setPlannedTransactionsForImport: (list: PlannedTransaction[]) => void;
}

function nextOccurrence(plannedDate: string, recurrence: PlannedTransactionRecurrence): string | null {
  const current = parseISO(plannedDate);
  let next: Date;
  switch (recurrence.frequency) {
    case 'daily':
      next = addDays(current, recurrence.interval);
      break;
    case 'weekly':
      next = addWeeks(current, recurrence.interval);
      break;
    case 'monthly':
      next = addMonths(current, recurrence.interval);
      break;
    case 'yearly':
      next = addYears(current, recurrence.interval);
      break;
    default:
      return null;
  }
  if (recurrence.endDate && isAfter(next, parseISO(recurrence.endDate))) return null;
  return next.toISOString();
}

export const usePlannedTransactionStore = create<PlannedTransactionState>()(
  persist(
    (set, get) => ({
      plannedTransactions: [],
      hasHydrated: false,

      addPlannedTransaction: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const planned: PlannedTransaction = {
          ...data,
          id,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          plannedTransactions: [...state.plannedTransactions, planned],
        }));
        return id;
      },

      updatePlannedTransaction: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          plannedTransactions: state.plannedTransactions.map((pt) =>
            pt.id === id ? { ...pt, ...updates, updatedAt: now } : pt
          ),
        }));
      },

      deletePlannedTransaction: (id) => {
        set((state) => ({
          plannedTransactions: state.plannedTransactions.filter((pt) => pt.id !== id),
        }));
      },

      realizePlannedTransaction: (id, actualDate) => {
        const planned = get().plannedTransactions.find((pt) => pt.id === id);
        if (!planned || planned.status !== 'pending') return null;

        const dateStr = actualDate ?? new Date().toISOString();
        const txId = useTransactionStore.getState().addTransaction({
          accountId: planned.accountId,
          type: planned.type,
          category: planned.category,
          amount: planned.amount,
          description: planned.description,
          date: dateStr,
        });

        const now = new Date().toISOString();
        set((state) => ({
          plannedTransactions: state.plannedTransactions.map((pt) =>
            pt.id === id
              ? { ...pt, status: 'realized', realizedTransactionId: txId, realizedDate: dateStr, updatedAt: now }
              : pt
          ),
        }));

        if (planned.isRecurring && planned.recurrence) {
          const nextDate = nextOccurrence(planned.plannedDate, planned.recurrence);
          if (nextDate) {
            get().addPlannedTransaction({
              type: planned.type,
              amount: planned.amount,
              category: planned.category,
              accountId: planned.accountId,
              plannedDate: nextDate,
              description: planned.description,
              note: planned.note,
              isRecurring: true,
              recurrence: planned.recurrence,
            });
          }
        }
        return txId;
      },

      cancelPlannedTransaction: (id) => {
        get().updatePlannedTransaction(id, { status: 'cancelled' });
      },

      getUpcoming: (days = 30) => {
        const now = startOfDay(new Date());
        return get().plannedTransactions.filter((pt) => {
          if (pt.status !== 'pending') return false;
          const d = startOfDay(parseISO(pt.plannedDate));
          const diff = differenceInDays(d, now);
          return diff >= 0 && diff <= days;
        });
      },

      getPending: () => {
        return get().plannedTransactions.filter((pt) => pt.status === 'pending');
      },

      getByAccount: (accountId) => {
        return get().plannedTransactions.filter((pt) => pt.accountId === accountId && pt.status === 'pending');
      },

      getOverdue: () => {
        const now = startOfDay(new Date());
        return get().plannedTransactions.filter((pt) => {
          if (pt.status !== 'pending') return false;
          return isBefore(parseISO(pt.plannedDate), now);
        });
      },

      setPlannedTransactionsForImport: (list) => {
        set({ plannedTransactions: Array.isArray(list) ? list : [] });
      },
    }),
    {
      name: 'onyx-planned-transactions',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
