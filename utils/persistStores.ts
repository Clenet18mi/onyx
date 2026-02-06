// ============================================
// ONYX - Persistance des stores (AsyncStorage + Zustand persist)
// ============================================

import {
  useAuthStore,
  useAccountStore,
  useTransactionStore,
  useBudgetStore,
  useGoalStore,
  useSubscriptionStore,
  useSettingsStore,
  useConfigStore,
} from '@/stores';

/**
 * Vérifie que tous les stores sont hydratés.
 * À utiliser pour attendre que les données soient chargées avant d'afficher l'UI.
 */
export function areAllStoresHydrated(): boolean {
  return (
    useAuthStore.getState().hasHydrated &&
    useAccountStore.getState().hasHydrated &&
    useTransactionStore.getState().hasHydrated &&
    useBudgetStore.getState().hasHydrated &&
    useGoalStore.getState().hasHydrated &&
    useSubscriptionStore.getState().hasHydrated &&
    useSettingsStore.getState().hasHydrated &&
    useConfigStore.getState().hasHydrated
  );
}

/** No-op : Zustand persist sauvegarde automatiquement à chaque changement. */
export function startPersistOnChange(): () => void {
  return () => {};
}
