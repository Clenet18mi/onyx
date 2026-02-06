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
  hasHydrated: boolean;
  
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
      hasHydrated: false,

      // Ajouter un projet d'épargne
      addGoal: (goalData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        // Récupérer le solde actuel du compte livret pour initialiser currentAmount
        const accountStore = useAccountStore.getState();
        const savingsAccount = accountStore.getAccount(goalData.accountId);
        const initialAmount = savingsAccount ? savingsAccount.balance : 0;
        
        const newGoal: SavingsGoal = {
          ...goalData,
          id,
          currentAmount: initialAmount,
          isCompleted: initialAmount >= goalData.targetAmount,
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
      // Note: L'argent reste sur le compte livret, on supprime juste le goal
      deleteGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;
        
        // L'argent reste sur le compte livret, on ne fait rien
        // L'utilisateur peut toujours accéder à son argent via le compte
        
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
        persistNow();
      },

      // Contribuer à un projet (ajouter de l'argent)
      // L'argent est transféré du compte source vers le compte livret du goal
      contributeToGoal: (goalId, amount, fromAccountId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return;

        const accountStore = useAccountStore.getState();
        const savingsAccount = accountStore.getAccount(goal.accountId);
        
        if (!savingsAccount) {
          console.error('[ONYX] Compte livret introuvable pour le goal:', goalId);
          return;
        }

        // Vérifier que le compte source a suffisamment de fonds
        const fromAccount = accountStore.getAccount(fromAccountId);
        if (!fromAccount || fromAccount.balance < amount) {
          console.error('[ONYX] Solde insuffisant sur le compte source');
          return;
        }

        // Créer un transfert : débit du compte source, crédit du compte livret
        const transactionStore = useTransactionStore.getState();
        transactionStore.addTransfer(
          fromAccountId,      // Compte source (débit)
          goal.accountId,     // Compte livret (crédit)
          amount,
          `Épargne vers: ${goal.name}`
        );

        // Mettre à jour le montant du projet pour refléter le solde réel sur le livret
        // Le solde du compte livret a déjà été mis à jour par addTransfer
        const updatedSavingsAccount = accountStore.getAccount(goal.accountId);
        const newAmount = updatedSavingsAccount ? updatedSavingsAccount.balance : goal.currentAmount + amount;
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
      // L'argent est transféré du compte livret vers le compte de destination
      withdrawFromGoal: (goalId, amount, toAccountId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return;

        const accountStore = useAccountStore.getState();
        const savingsAccount = accountStore.getAccount(goal.accountId);
        
        if (!savingsAccount) {
          console.error('[ONYX] Compte livret introuvable pour le goal:', goalId);
          return;
        }

        // Vérifier que le compte livret a suffisamment de fonds
        if (savingsAccount.balance < amount) {
          console.error('[ONYX] Solde insuffisant sur le compte livret');
          return;
        }

        // Créer un transfert : débit du compte livret, crédit du compte destination
        const transactionStore = useTransactionStore.getState();
        transactionStore.addTransfer(
          goal.accountId,    // Compte livret (débit)
          toAccountId,       // Compte destination (crédit)
          amount,
          `Retrait de: ${goal.name}`
        );

        // Mettre à jour le montant du projet (reflète le solde réel sur le livret)
        // Le solde du compte livret a déjà été mis à jour par addTransfer
        const updatedSavingsAccount = accountStore.getAccount(goal.accountId);
        const newAmount = updatedSavingsAccount ? updatedSavingsAccount.balance : Math.max(goal.currentAmount - amount, 0);

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

        // Synchroniser currentAmount avec le solde réel du compte livret
        const accountStore = useAccountStore.getState();
        const savingsAccount = accountStore.getAccount(goal.accountId);
        const currentAmount = savingsAccount ? savingsAccount.balance : goal.currentAmount;

        const percentage = goal.targetAmount > 0 
          ? (currentAmount / goal.targetAmount) * 100 
          : 0;
        const remaining = Math.max(goal.targetAmount - currentAmount, 0);

        return {
          current: currentAmount,
          target: goal.targetAmount,
          percentage: Math.min(percentage, 100),
          remaining,
        };
      },
    }),
    {
      name: 'onyx-goals',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);
