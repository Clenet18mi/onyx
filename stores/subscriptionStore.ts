// ============================================
// ONYX - Subscription Store
// Gestion des abonnements récurrents
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { Subscription, RecurrenceFrequency } from '@/types';
import { generateId } from '@/utils/crypto';
import { useTransactionStore } from './transactionStore';
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { safeParseISO } from '@/utils/format';

interface SubscriptionState {
  subscriptions: Subscription[];
  hasHydrated: boolean;
  
  // Actions
  addSubscription: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscription: (id: string) => void;
  processSubscriptions: () => void; // Traiter les abonnements dus
  
  // Getters
  getSubscription: (id: string) => Subscription | undefined;
  getActiveSubscriptions: () => Subscription[];
  getTotalMonthlySubscriptions: () => number;
  getUpcomingSubscriptions: (days: number) => Subscription[];
  /** Total annuel (mensuel×12, annuel×1, hebdo×52, trimestriel×4) */
  getTotalYearlySubscriptions: () => number;
  /** Abonnements actifs dont nextBillingDate est dans le mois en cours, triés par date */
  getSubscriptionsThisMonth: () => Subscription[];
  /** Remplace tous les abonnements (import sauvegarde JSON) */
  setSubscriptionsForImport: (subscriptions: Subscription[]) => void;
}

// Calculer la prochaine date de facturation
function getNextBillingDate(currentDate: string, frequency: RecurrenceFrequency): string {
  const date = safeParseISO(currentDate);
  if (!date) return currentDate;

  switch (frequency) {
    case 'daily':
      return addDays(date, 1).toISOString();
    case 'weekly':
      return addWeeks(date, 1).toISOString();
    case 'monthly':
      return addMonths(date, 1).toISOString();
    case 'yearly':
      return addYears(date, 1).toISOString();
    default:
      return addMonths(date, 1).toISOString();
  }
}

// Convertir en montant annuel
function toYearlyAmount(amount: number, frequency: RecurrenceFrequency): number {
  switch (frequency) {
    case 'daily':
      return amount * 365;
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'yearly':
      return amount;
    default:
      return amount * 12;
  }
}

// Convertir en montant mensuel
function toMonthlyAmount(amount: number, frequency: RecurrenceFrequency): number {
  switch (frequency) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return amount * 4;
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      hasHydrated: false,

      // Ajouter un abonnement
      addSubscription: (subscriptionData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newSubscription: Subscription = {
          ...subscriptionData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }));
        return id;
      },

      // Mettre à jour un abonnement
      updateSubscription: (id, updates) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? { ...sub, ...updates, updatedAt: new Date().toISOString() }
              : sub
          ),
        }));
      },

      // Supprimer un abonnement
      deleteSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
        }));
      },

      // Activer/désactiver un abonnement
      toggleSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? { ...sub, isActive: !sub.isActive, updatedAt: new Date().toISOString() }
              : sub
          ),
        }));
      },

      // Traiter les abonnements dus (créer les transactions automatiquement)
      processSubscriptions: () => {
        const subscriptions = get().subscriptions;
        const transactionStore = useTransactionStore.getState();
        const today = startOfDay(new Date());

        subscriptions.forEach((sub) => {
          if (!sub.isActive) return;
          const billingDateParsed = safeParseISO(sub.nextBillingDate);
          if (!billingDateParsed) return;
          const billingDate = startOfDay(billingDateParsed);
          
          // Si la date de facturation est passée ou aujourd'hui
          if (isBefore(billingDate, today) || billingDate.getTime() === today.getTime()) {
            // Créer la transaction
            transactionStore.addTransaction({
              accountId: sub.accountId,
              type: 'expense',
              category: sub.category,
              amount: sub.amount,
              description: `Abonnement: ${sub.name}`,
              date: new Date().toISOString(),
              subscriptionId: sub.id,
            });

            // Mettre à jour la prochaine date de facturation
            const nextDate = getNextBillingDate(sub.nextBillingDate, sub.frequency);
            get().updateSubscription(sub.id, { nextBillingDate: nextDate });
          }
        });
      },

      // Getters
      getSubscription: (id) => {
        return get().subscriptions.find((sub) => sub.id === id);
      },

      getActiveSubscriptions: () => {
        return get().subscriptions.filter((sub) => sub.isActive);
      },

      // Total mensuel des abonnements
      getTotalMonthlySubscriptions: () => {
        return get()
          .subscriptions
          .filter((sub) => sub.isActive)
          .reduce((total, sub) => total + toMonthlyAmount(sub.amount, sub.frequency), 0);
      },

      getTotalYearlySubscriptions: () => {
        return get()
          .subscriptions
          .filter((sub) => sub.isActive)
          .reduce((total, sub) => total + toYearlyAmount(sub.amount, sub.frequency), 0);
      },

      getSubscriptionsThisMonth: () => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return get()
          .subscriptions
          .filter((sub) => {
            if (!sub.isActive) return false;
            const d = safeParseISO(sub.nextBillingDate);
            return d != null && isWithinInterval(d, { start, end });
          })
          .sort((a, b) => {
            const da = safeParseISO(a.nextBillingDate)?.getTime() ?? 0;
            const db = safeParseISO(b.nextBillingDate)?.getTime() ?? 0;
            return da - db;
          });
      },

      // Abonnements à venir dans les X prochains jours
      getUpcomingSubscriptions: (days) => {
        const today = new Date();
        const futureDate = addDays(today, days);
        
        return get()
          .subscriptions
          .filter((sub) => {
            if (!sub.isActive) return false;
            const billingDate = safeParseISO(sub.nextBillingDate);
            return billingDate != null && isBefore(billingDate, futureDate);
          })
          .sort((a, b) => {
            const da = safeParseISO(a.nextBillingDate)?.getTime() ?? 0;
            const db = safeParseISO(b.nextBillingDate)?.getTime() ?? 0;
            return da - db;
          });
      },

      setSubscriptionsForImport: (subscriptions) => {
        set({ subscriptions });
      },
    }),
    {
      name: 'onyx-subscriptions',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);
