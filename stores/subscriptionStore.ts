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
import { addDays, addWeeks, addMonths, addYears, isBefore, parseISO, startOfDay } from 'date-fns';

interface SubscriptionState {
  subscriptions: Subscription[];
  
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
}

// Calculer la prochaine date de facturation
function getNextBillingDate(currentDate: string, frequency: RecurrenceFrequency): string {
  const date = parseISO(currentDate);
  
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

          const billingDate = startOfDay(parseISO(sub.nextBillingDate));
          
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

      // Abonnements à venir dans les X prochains jours
      getUpcomingSubscriptions: (days) => {
        const today = new Date();
        const futureDate = addDays(today, days);
        
        return get()
          .subscriptions
          .filter((sub) => {
            if (!sub.isActive) return false;
            const billingDate = parseISO(sub.nextBillingDate);
            return isBefore(billingDate, futureDate);
          })
          .sort((a, b) => 
            parseISO(a.nextBillingDate).getTime() - parseISO(b.nextBillingDate).getTime()
          );
      },
    }),
    {
      name: 'onyx-subscriptions',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
