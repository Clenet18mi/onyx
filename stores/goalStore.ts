// ============================================
// ONYX - Goal Store
// Gestion des projets d'épargne
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, persistNow } from '@/utils/storage';
import { SavingsGoal } from '@/types';
import { generateId } from '@/utils/crypto';
import { useTransactionStore } from './transactionStore';
import { useAccountStore } from './accountStore';

interface GoalState {
  goals: SavingsGoal[];
  
  // Actions
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'isCompleted' | 'createdAt' | 'updatedAt'>) => string;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, fromAccountId: string) => void;
  withdrawFromGoal: (goalId: string, amount: number, toAccountId: string) => void;
  
  // Getters
  getGoal: (id: string) => SavingsGoal | undefined;
  getActiveGoals: () => SavingsGoal[];
  getCompletedGoals: () => SavingsGoal[];
  getGoalProgress: (goalId: string) => { current: number; target: number; percentage: number; remaining: number };
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],

      // Ajouter un projet d'épargne
      addGoal: (goalData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newGoal: SavingsGoal = {
          ...goalData,
          id,
          currentAmount: 0,
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
        persistNow();
        return id;
      },

      // Mettre à jour un projet
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
              : goal
          ),
        }));
        persistNow();
      },

      // Supprimer un projet
      deleteGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (goal && goal.currentAmount > 0) {
          // Retourner l'argent au compte lié
          const accountStore = useAccountStore.getState();
          accountStore.updateBalance(goal.accountId, goal.currentAmount);
        }
        
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
        persistNow();
      },

      // Contribuer à un projet (ajouter de l'argent)
      contributeToGoal: (goalId, amount, fromAccountId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return;

        // Créer la transaction
        const transactionStore = useTransactionStore.getState();
        transactionStore.addTransaction({
          accountId: fromAccountId,
          type: 'expense',
          category: 'savings',
          amount,
          description: `Épargne vers: ${goal.name}`,
          date: new Date().toISOString(),
          goalId,
        });

        // Mettre à jour le montant du projet
        const newAmount = goal.currentAmount + amount;
        const isCompleted = newAmount >= goal.targetAmount;

        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? { 
                  ...g, 
                  currentAmount: newAmount, 
                  isCompleted,
                  updatedAt: new Date().toISOString() 
                }
              : g
          ),
        }));
        persistNow();
      },

      // Retirer de l'argent d'un projet
      withdrawFromGoal: (goalId, amount, toAccountId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || amount > goal.currentAmount) return;

        // Créer la transaction
        const transactionStore = useTransactionStore.getState();
        transactionStore.addTransaction({
          accountId: toAccountId,
          type: 'income',
          category: 'savings',
          amount,
          description: `Retrait de: ${goal.name}`,
          date: new Date().toISOString(),
          goalId,
        });

        // Mettre à jour le montant du projet
        const newAmount = goal.currentAmount - amount;

        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? { 
                  ...g, 
                  currentAmount: newAmount, 
                  isCompleted: false,
                  updatedAt: new Date().toISOString() 
                }
              : g
          ),
        }));
        persistNow();
      },

      // Getters
      getGoal: (id) => {
        return get().goals.find((goal) => goal.id === id);
      },

      getActiveGoals: () => {
        return get().goals.filter((goal) => !goal.isCompleted);
      },

      getCompletedGoals: () => {
        return get().goals.filter((goal) => goal.isCompleted);
      },

      getGoalProgress: (goalId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) {
          return { current: 0, target: 0, percentage: 0, remaining: 0 };
        }

        const percentage = goal.targetAmount > 0 
          ? (goal.currentAmount / goal.targetAmount) * 100 
          : 0;
        const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

        return {
          current: goal.currentAmount,
          target: goal.targetAmount,
          percentage: Math.min(percentage, 100),
          remaining,
        };
      },
    }),
    {
      name: 'onyx-goals',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
