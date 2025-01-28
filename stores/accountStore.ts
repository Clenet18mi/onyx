// ============================================
// ONYX - Account Store
// Gestion des comptes financiers
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { Account, AccountType } from '@/types';
import { generateId } from '@/utils/crypto';

interface AccountState {
  accounts: Account[];
  
  // Actions
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  archiveAccount: (id: string) => void;
  updateBalance: (id: string, amount: number) => void;
  getAccount: (id: string) => Account | undefined;
  getActiveAccounts: () => Account[];
  getTotalBalance: () => number;
  getBalanceByType: (type: AccountType) => number;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],

      // Ajouter un compte
      addAccount: (accountData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newAccount: Account = {
          ...accountData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          accounts: [...state.accounts, newAccount],
        }));
        
        return id;
      },

      // Mettre à jour un compte
      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === id
              ? { ...account, ...updates, updatedAt: new Date().toISOString() }
              : account
          ),
        }));
      },

      // Supprimer un compte
      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((account) => account.id !== id),
        }));
      },

      // Archiver un compte
      archiveAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === id
              ? { ...account, isArchived: true, updatedAt: new Date().toISOString() }
              : account
          ),
        }));
      },

      // Mettre à jour le solde (ajouter/soustraire)
      updateBalance: (id, amount) => {
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === id
              ? { 
                  ...account, 
                  balance: account.balance + amount, 
                  updatedAt: new Date().toISOString() 
                }
              : account
          ),
        }));
      },

      // Obtenir un compte par ID
      getAccount: (id) => {
        return get().accounts.find((account) => account.id === id);
      },

      // Obtenir les comptes actifs (non archivés)
      getActiveAccounts: () => {
        return get().accounts.filter((account) => !account.isArchived);
      },

      // Obtenir le solde total
      getTotalBalance: () => {
        return get()
          .accounts
          .filter((account) => !account.isArchived)
          .reduce((total, account) => total + account.balance, 0);
      },

      // Obtenir le solde par type de compte
      getBalanceByType: (type) => {
        return get()
          .accounts
          .filter((account) => account.type === type && !account.isArchived)
          .reduce((total, account) => total + account.balance, 0);
      },
    }),
    {
      name: 'onyx-accounts',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
