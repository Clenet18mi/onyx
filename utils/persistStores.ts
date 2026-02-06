// ============================================
// ONYX - Persistance des stores
// Zustand persist gère automatiquement la sauvegarde avec MMKV
// Réhydratation manuelle après que JSI/MMKV soit prêt (évite données perdues au redémarrage)
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
 * Lance la réhydratation de tous les stores depuis MMKV.
 * À appeler une seule fois au démarrage, une fois que l'app (et JSI) est prête.
 */
export async function rehydrateAllStores(): Promise<void> {
  await Promise.all([
    useAuthStore.persist.rehydrate(),
    useAccountStore.persist.rehydrate(),
    useTransactionStore.persist.rehydrate(),
    useBudgetStore.persist.rehydrate(),
    useGoalStore.persist.rehydrate(),
    useSubscriptionStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
    useConfigStore.persist.rehydrate(),
  ]);
}

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

/**
 * Fonction de compatibilité - MMKV est synchrone, Zustand persist gère tout automatiquement.
 * Plus besoin de sauvegarde manuelle.
 */
export async function saveAllStoresToDisk(): Promise<void> {
  // Zustand persist gère automatiquement la sauvegarde avec MMKV
  // Cette fonction est conservée pour compatibilité mais ne fait rien
  return Promise.resolve();
}

/**
 * Fonction de compatibilité - Zustand persist gère automatiquement les changements.
 * Plus besoin d'abonnement manuel.
 */
export function startPersistOnChange(): () => void {
  // Zustand persist gère automatiquement la persistance
  // Cette fonction est conservée pour compatibilité mais retourne un no-op
  return () => {
    // No-op
  };
}
