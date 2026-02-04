// ============================================
// ONYX - Budget Store
// Gestion des budgets par catégorie
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, persistNow } from '@/utils/storage';
import { Budget, TransactionCategory } from '@/types';
import { generateId } from '@/utils/crypto';
import { useTransactionStore } from './transactionStore';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';

interface BudgetState {
  budgets: Budget[];
  
  // Actions
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  // Getters
  getBudget: (id: string) => Budget | undefined;
  getBudgetByCategory: (category: TransactionCategory) => Budget | undefined;
  getBudgetProgress: (budgetId: string) => { spent: number; limit: number; percentage: number; remaining: number };
  getAllBudgetsProgress: () => Array<Budget & { spent: number; percentage: number; remaining: number }>;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],

      // Ajouter un budget
      addBudget: (budgetData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newBudget: Budget = {
          ...budgetData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));
        persistNow();
        return id;
      },

      // Mettre à jour un budget
      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((budget) =>
            budget.id === id
              ? { ...budget, ...updates, updatedAt: new Date().toISOString() }
              : budget
          ),
        }));
        persistNow();
      },

      // Supprimer un budget
      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((budget) => budget.id !== id),
        }));
        persistNow();
      },

      // Obtenir un budget par ID
      getBudget: (id) => {
        return get().budgets.find((budget) => budget.id === id);
      },

      // Obtenir un budget par catégorie
      getBudgetByCategory: (category) => {
        return get().budgets.find((budget) => budget.category === category);
      },

      // Calculer la progression d'un budget
      getBudgetProgress: (budgetId) => {
        const budget = get().budgets.find((b) => b.id === budgetId);
        if (!budget) {
          return { spent: 0, limit: 0, percentage: 0, remaining: 0 };
        }

        // Déterminer la période
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (budget.period) {
          case 'weekly':
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            break;
          case 'monthly':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'yearly':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        }

        // Calculer les dépenses pour cette catégorie sur la période
        const transactionStore = useTransactionStore.getState();
        const transactions = transactionStore.getTransactionsByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        );

        const spent = transactions
          .filter((tx) => tx.type === 'expense' && tx.category === budget.category)
          .reduce((total, tx) => total + tx.amount, 0);

        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        const remaining = Math.max(budget.limit - spent, 0);

        return {
          spent,
          limit: budget.limit,
          percentage: Math.min(percentage, 100),
          remaining,
        };
      },

      // Obtenir la progression de tous les budgets
      getAllBudgetsProgress: () => {
        const budgets = get().budgets;
        return budgets.map((budget) => {
          const progress = get().getBudgetProgress(budget.id);
          return {
            ...budget,
            spent: progress.spent,
            percentage: progress.percentage,
            remaining: progress.remaining,
          };
        });
      },
    }),
    {
      name: 'onyx-budgets',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
