// ============================================
// ONYX - Sauvegarde explicite de TOUS les stores sur le téléphone
// Écriture directe dans AsyncStorage pour garantir la persistance.
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPersistNow } from '@/utils/storage';
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

const PREFIX = 'onyx_storage_';

const STORE_KEYS = [
  'onyx-auth',
  'onyx-accounts',
  'onyx-transactions',
  'onyx-budgets',
  'onyx-goals',
  'onyx-subscriptions',
  'onyx-settings',
  'onyx-config',
] as const;

/** État auth à persister (sans isAuthenticated pour forcer le lock au redémarrage) */
function getAuthStateToPersist() {
  const s = useAuthStore.getState();
  return {
    isSetup: s.isSetup,
    pinHash: s.pinHash,
    pinLength: s.pinLength,
    biometricEnabled: s.biometricEnabled,
    lastUnlocked: s.lastUnlocked,
    failedAttempts: s.failedAttempts,
    lockoutUntil: s.lockoutUntil,
  };
}

/**
 * Sauvegarde TOUS les stores directement dans AsyncStorage.
 * À appeler à la mise en arrière-plan et après chaque action importante.
 */
export async function saveAllStoresToDisk(): Promise<void> {
  const writes: Promise<void>[] = [];

  try {
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-auth', JSON.stringify(getAuthStateToPersist()))
    );
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-accounts', JSON.stringify(useAccountStore.getState()))
    );
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-transactions', JSON.stringify(useTransactionStore.getState()))
    );
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-budgets', JSON.stringify(useBudgetStore.getState()))
    );
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-goals', JSON.stringify(useGoalStore.getState()))
    );
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-subscriptions', JSON.stringify(useSubscriptionStore.getState()))
    );
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-settings', JSON.stringify(useSettingsStore.getState()))
    );
    writes.push(
      AsyncStorage.setItem(PREFIX + 'onyx-config', JSON.stringify(useConfigStore.getState()))
    );

    await Promise.all(writes);
  } catch (e) {
    console.warn('[ONYX] saveAllStoresToDisk failed', e);
  }
}

// Enregistrer la sauvegarde immédiate (chaque store appellera persistNow() après chaque action)
registerPersistNow(saveAllStoresToDisk);

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 800;

/** Déclenche une sauvegarde après chaque changement de store (debounce). */
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    saveAllStoresToDisk();
  }, DEBOUNCE_MS);
}

/**
 * Abonne aux changements de tous les stores pour sauvegarder régulièrement sur le disque.
 * À appeler une fois au démarrage de l'app.
 */
export function startPersistOnChange(): () => void {
  const unsubAuth = useAuthStore.subscribe(scheduleSave);
  const unsubAccounts = useAccountStore.subscribe(scheduleSave);
  const unsubTransactions = useTransactionStore.subscribe(scheduleSave);
  const unsubBudgets = useBudgetStore.subscribe(scheduleSave);
  const unsubGoals = useGoalStore.subscribe(scheduleSave);
  const unsubSubs = useSubscriptionStore.subscribe(scheduleSave);
  const unsubSettings = useSettingsStore.subscribe(scheduleSave);
  const unsubConfig = useConfigStore.subscribe(scheduleSave);

  return () => {
    unsubAuth();
    unsubAccounts();
    unsubTransactions();
    unsubBudgets();
    unsubGoals();
    unsubSubs();
    unsubSettings();
    unsubConfig();
    if (saveTimeout) clearTimeout(saveTimeout);
  };
}
