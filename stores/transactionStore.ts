// ============================================
// ONYX - Transaction Store
// Gestion des transactions
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { Transaction, TransactionType, TransactionCategory } from '@/types';
import { generateId } from '@/utils/crypto';
import { useAccountStore } from './accountStore';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';

interface TransactionState {
  transactions: Transaction[];
  hasHydrated: boolean;
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => string;
  addTransfer: (fromAccountId: string, toAccountId: string, amount: number, description: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Getters
  getTransaction: (id: string) => Transaction | undefined;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (category: TransactionCategory) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTransactionsThisMonth: () => Transaction[];
  getTransactionsThisWeek: () => Transaction[];
  
  // Analytics
  getTotalIncome: (startDate?: string, endDate?: string) => number;
  getTotalExpenses: (startDate?: string, endDate?: string) => number;
  getCashflow: (startDate?: string, endDate?: string) => { income: number; expenses: number; net: number };
  getSpendingByCategory: (startDate?: string, endDate?: string) => Record<TransactionCategory, number>;
  /** Remplace toutes les transactions (import sauvegarde JSON, sans mise à jour des soldes) */
  setTransactionsForImport: (transactions: Transaction[]) => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      hasHydrated: false,

      // Ajouter une transaction
      addTransaction: (transactionData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newTransaction: Transaction = {
          ...transactionData,
          id,
          createdAt: now,
        };
        
        // Mettre à jour le solde du compte
        const accountStore = useAccountStore.getState();
        const amount = transactionData.type === 'income' 
          ? transactionData.amount 
          : -transactionData.amount;
        accountStore.updateBalance(transactionData.accountId, amount);
        
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
        return id;
      },

      // Ajouter un transfert (transaction spéciale)
      addTransfer: (fromAccountId, toAccountId, amount, description) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        // Créer la transaction de transfert
        const transfer: Transaction = {
          id,
          accountId: fromAccountId,
          toAccountId,
          type: 'transfer',
          category: 'transfer',
          amount,
          description: description || `Virement vers compte`,
          date: now,
          createdAt: now,
        };
        
        // Mettre à jour les soldes des comptes
        const accountStore = useAccountStore.getState();
        accountStore.updateBalance(fromAccountId, -amount);
        accountStore.updateBalance(toAccountId, amount);
        
        set((state) => ({
          transactions: [transfer, ...state.transactions],
        }));
      },

      // Mettre à jour une transaction (et ajuster les soldes)
      updateTransaction: (id, updates) => {
        const prev = get().transactions.find((tx) => tx.id === id);
        if (!prev) return;
        const accountStore = useAccountStore.getState();
        const next = { ...prev, ...updates };
        if (prev.type === 'transfer' && prev.toAccountId) {
          accountStore.updateBalance(prev.accountId, prev.amount);
          accountStore.updateBalance(prev.toAccountId, -prev.amount);
        } else {
          const rev = prev.type === 'income' ? -prev.amount : prev.amount;
          accountStore.updateBalance(prev.accountId, rev);
        }
        if (next.type === 'transfer' && next.toAccountId) {
          accountStore.updateBalance(next.accountId, -next.amount);
          accountStore.updateBalance(next.toAccountId, next.amount);
        } else {
          const delta = next.type === 'income' ? next.amount : -next.amount;
          accountStore.updateBalance(next.accountId, delta);
        }
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? next : tx
          ),
        }));
      },

      // Supprimer une transaction (et annuler son effet sur le solde)
      deleteTransaction: (id) => {
        const transaction = get().transactions.find((tx) => tx.id === id);
        if (transaction) {
          const accountStore = useAccountStore.getState();
          
          if (transaction.type === 'transfer' && transaction.toAccountId) {
            // Annuler le transfert
            accountStore.updateBalance(transaction.accountId, transaction.amount);
            accountStore.updateBalance(transaction.toAccountId, -transaction.amount);
          } else {
            // Annuler la transaction normale
            const reverseAmount = transaction.type === 'income' 
              ? -transaction.amount 
              : transaction.amount;
            accountStore.updateBalance(transaction.accountId, reverseAmount);
          }
        }
        
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },

      // Getters
      getTransaction: (id) => {
        return get().transactions.find((tx) => tx.id === id);
      },

      getTransactionsByAccount: (accountId) => {
        return get().transactions.filter(
          (tx) => tx.accountId === accountId || tx.toAccountId === accountId
        );
      },

      getTransactionsByCategory: (category) => {
        return get().transactions.filter((tx) => tx.category === category);
      },

      getTransactionsByDateRange: (startDate, endDate) => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return get().transactions.filter((tx) => {
          const txDate = parseISO(tx.date);
          return isWithinInterval(txDate, { start, end });
        });
      },

      getTransactionsThisMonth: () => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return get().transactions.filter((tx) => {
          const txDate = parseISO(tx.date);
          return isWithinInterval(txDate, { start, end });
        });
      },

      getTransactionsThisWeek: () => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        return get().transactions.filter((tx) => {
          const txDate = parseISO(tx.date);
          return isWithinInterval(txDate, { start, end });
        });
      },

      // Analytics
      getTotalIncome: (startDate, endDate) => {
        let transactions = get().transactions.filter((tx) => tx.type === 'income');
        
        if (startDate && endDate) {
          const start = parseISO(startDate);
          const end = parseISO(endDate);
          transactions = transactions.filter((tx) => {
            const txDate = parseISO(tx.date);
            return isWithinInterval(txDate, { start, end });
          });
        }
        
        return transactions.reduce((total, tx) => total + tx.amount, 0);
      },

      getTotalExpenses: (startDate, endDate) => {
        let transactions = get().transactions.filter((tx) => tx.type === 'expense');
        
        if (startDate && endDate) {
          const start = parseISO(startDate);
          const end = parseISO(endDate);
          transactions = transactions.filter((tx) => {
            const txDate = parseISO(tx.date);
            return isWithinInterval(txDate, { start, end });
          });
        }
        
        return transactions.reduce((total, tx) => total + tx.amount, 0);
      },

      getCashflow: (startDate, endDate) => {
        const income = get().getTotalIncome(startDate, endDate);
        const expenses = get().getTotalExpenses(startDate, endDate);
        return {
          income,
          expenses,
          net: income - expenses,
        };
      },

      getSpendingByCategory: (startDate, endDate) => {
        let transactions = get().transactions.filter((tx) => tx.type === 'expense');
        
        if (startDate && endDate) {
          const start = parseISO(startDate);
          const end = parseISO(endDate);
          transactions = transactions.filter((tx) => {
            const txDate = parseISO(tx.date);
            return isWithinInterval(txDate, { start, end });
          });
        }
        
        return transactions.reduce((acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          return acc;
        }, {} as Record<TransactionCategory, number>);
      },

      setTransactionsForImport: (transactions) => {
        set({ transactions });
      },
    }),
    {
      name: 'onyx-transactions',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);
