// ============================================
// ONYX - Auth Store
// PIN haché SHA-256, limitation tentatives, option effacement données
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { hashPin, verifyPin, verifyPinSync } from '@/utils/crypto';

export interface ValidatePinResult {
  success: boolean;
  error?: string;
  shouldWipe?: boolean;
}

interface AuthState {
  isSetup: boolean;
  pinHash: string | null;
  pinLength: 4 | 6;
  biometricEnabled: boolean;
  isAuthenticated: boolean;
  lastUnlocked: string | null;
  failedAttempts: number;
  lockoutUntil: string | null;
  hasHydrated: boolean;
  /** Échecs consécutifs (pour option effacement après N échecs) */
  criticalFailures: number;
  wipeDataOnMaxFailures: boolean;

  setupPin: (pin: string, length: 4 | 6) => Promise<void>;
  /** Vérifie le PIN et déverrouille. Retourne résultat détaillé. */
  validatePin: (pin: string) => Promise<ValidatePinResult>;
  /** Vérifie le PIN et déverrouille (retourne true/false pour compatibilité). */
  verifyAndUnlock: (pin: string) => Promise<boolean>;
  getLockoutRemainingSeconds: () => number;
  enableBiometric: (enabled: boolean) => void;
  unlockWithBiometric: () => void;
  lock: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  resetAuth: () => void;
  isLockedOut: () => boolean;
  setWipeDataOnMaxFailures: (enabled: boolean) => void;
  wipeAllData: () => Promise<void>;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 secondes
const MAX_CRITICAL_FAILURES = 10;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isSetup: false,
      pinHash: null,
      pinLength: 4,
      biometricEnabled: false,
      isAuthenticated: false,
      lastUnlocked: null,
      failedAttempts: 0,
      lockoutUntil: null,
      hasHydrated: false,
      criticalFailures: 0,
      wipeDataOnMaxFailures: false,

      setupPin: async (pin: string, length: 4 | 6) => {
        const h = await hashPin(pin);
        set({
          isSetup: true,
          pinHash: h,
          pinLength: length,
          isAuthenticated: true,
          lastUnlocked: new Date().toISOString(),
          failedAttempts: 0,
          lockoutUntil: null,
          criticalFailures: 0,
        });
      },

      validatePin: async (pin: string): Promise<ValidatePinResult> => {
        const state = get();
        if (state.isLockedOut()) {
          const remaining = get().getLockoutRemainingSeconds();
          return {
            success: false,
            error: `Trop de tentatives. Réessayez dans ${remaining}s`,
          };
        }
        if (!state.pinHash) {
          return { success: false, error: 'Aucun PIN configuré' };
        }

        let isValid = await verifyPin(pin, state.pinHash);
        if (!isValid && state.pinHash && state.pinHash.includes('-')) {
          isValid = verifyPinSync(pin, state.pinHash);
          if (isValid) {
            const newHash = await hashPin(pin);
            set({ pinHash: newHash });
          }
        }
        if (isValid) {
          set({
            isAuthenticated: true,
            lastUnlocked: new Date().toISOString(),
            failedAttempts: 0,
            lockoutUntil: null,
            criticalFailures: 0,
          });
          return { success: true };
        }

        const newAttempts = get().failedAttempts + 1;
        const newCritical = get().criticalFailures + 1;
        set({ failedAttempts: newAttempts, criticalFailures: newCritical });

        if (get().wipeDataOnMaxFailures && newCritical >= MAX_CRITICAL_FAILURES) {
          return {
            success: false,
            error: 'Trop de tentatives. Les données vont être effacées pour protection.',
            shouldWipe: true,
          };
        }

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          set({
            lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString(),
          });
          return {
            success: false,
            error: `Trop de tentatives. Bloqué pendant ${LOCKOUT_DURATION_MS / 1000}s`,
          };
        }

        const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
        return {
          success: false,
          error: `Code incorrect. ${remaining} tentative(s) restante(s)`,
        };
      },

      verifyAndUnlock: async (pin: string): Promise<boolean> => {
        const result = await get().validatePin(pin);
        return result.success;
      },

      getLockoutRemainingSeconds: (): number => {
        const { lockoutUntil } = get();
        if (!lockoutUntil) return 0;
        const end = new Date(lockoutUntil).getTime();
        const now = Date.now();
        return Math.max(0, Math.ceil((end - now) / 1000));
      },

      enableBiometric: (enabled: boolean) => {
        set({ biometricEnabled: enabled });
      },

      unlockWithBiometric: () => {
        set({
          isAuthenticated: true,
          lastUnlocked: new Date().toISOString(),
          failedAttempts: 0,
        });
      },

      lock: () => {
        set({ isAuthenticated: false });
      },

      changePin: async (oldPin: string, newPin: string): Promise<boolean> => {
        const { pinHash } = get();
        if (!pinHash) return false;
        let ok = await verifyPin(oldPin, pinHash);
        if (!ok && pinHash.includes('-')) ok = verifyPinSync(oldPin, pinHash);
        if (!ok) return false;
        const newHash = await hashPin(newPin);
        set({
          pinHash: newHash,
          pinLength: newPin.length as 4 | 6,
        });
        return true;
      },

      resetAuth: () => {
        set({
          isSetup: false,
          pinHash: null,
          pinLength: 4,
          biometricEnabled: false,
          isAuthenticated: false,
          lastUnlocked: null,
          failedAttempts: 0,
          lockoutUntil: null,
          criticalFailures: 0,
        });
      },

      isLockedOut: (): boolean => {
        const { lockoutUntil } = get();
        if (!lockoutUntil) return false;
        return new Date(lockoutUntil) > new Date();
      },

      setWipeDataOnMaxFailures: (enabled: boolean) => {
        set({ wipeDataOnMaxFailures: enabled });
      },

      wipeAllData: async () => {
        const { storage } = await import('@/utils/storage');
        const { useAccountStore } = await import('@/stores/accountStore');
        const { useTransactionStore } = await import('@/stores/transactionStore');
        const { useBudgetStore } = await import('@/stores/budgetStore');
        const { useGoalStore } = await import('@/stores/goalStore');
        const { useSubscriptionStore } = await import('@/stores/subscriptionStore');
        const { usePlannedTransactionStore } = await import('@/stores/plannedTransactionStore');
        const { useConfigStore } = await import('@/stores/configStore');
        const { useFilterStore } = await import('@/stores/filterStore');
        const { useTemplateStore } = await import('@/stores/templateStore');
        const { useWishlistStore } = await import('@/stores/wishlistStore');
        const { useReminderStore } = await import('@/stores/reminderStore');

        try {
          useAccountStore.getState().setAccountsForImport?.([]);
          useTransactionStore.getState().setTransactionsForImport?.([]);
          useBudgetStore.getState().setBudgetsForImport?.([]);
          useGoalStore.getState().setGoalsForImport?.([]);
          useSubscriptionStore.getState().setSubscriptionsForImport?.([]);
          usePlannedTransactionStore.getState().setPlannedTransactionsForImport?.([]);
        } catch (_) {}
        try {
          useConfigStore.getState().reset?.();
        } catch (_) {}
        try {
          useFilterStore.getState().reset?.();
        } catch (_) {}
        try {
          useTemplateStore.getState().reset?.();
        } catch (_) {}
        try {
          useWishlistStore.getState().reset?.();
        } catch (_) {}
        try {
          useReminderStore.getState().reset?.();
        } catch (_) {}

        await storage.clearAll();
        get().resetAuth();
      },
    }),
    {
      name: 'onyx-auth',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({
        isSetup: s.isSetup,
        pinHash: s.pinHash,
        pinLength: s.pinLength,
        biometricEnabled: s.biometricEnabled,
        lastUnlocked: s.lastUnlocked,
        failedAttempts: s.failedAttempts,
        lockoutUntil: s.lockoutUntil,
        criticalFailures: s.criticalFailures,
        wipeDataOnMaxFailures: s.wipeDataOnMaxFailures,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
          state.isAuthenticated = false;
        }
      },
    }
  )
);
