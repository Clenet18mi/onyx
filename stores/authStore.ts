// ============================================
// ONYX - Auth Store
// Gestion de l'authentification PIN/Biométrie
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, persistNow } from '@/utils/storage';
import { hashPin, verifyPin } from '@/utils/crypto';

interface AuthState {
  // État
  isSetup: boolean;
  pinHash: string | null;
  pinLength: 4 | 6;
  biometricEnabled: boolean;
  isAuthenticated: boolean;
  lastUnlocked: string | null;
  failedAttempts: number;
  lockoutUntil: string | null;
  
  // Actions
  setupPin: (pin: string, length: 4 | 6) => void;
  verifyAndUnlock: (pin: string) => boolean;
  enableBiometric: (enabled: boolean) => void;
  unlockWithBiometric: () => void;
  lock: () => void;
  changePin: (oldPin: string, newPin: string) => boolean;
  resetAuth: () => void;
  isLockedOut: () => boolean;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      isSetup: false,
      pinHash: null,
      pinLength: 4,
      biometricEnabled: false,
      isAuthenticated: false,
      lastUnlocked: null,
      failedAttempts: 0,
      lockoutUntil: null,

      // Configurer le PIN initial
      setupPin: (pin: string, length: 4 | 6) => {
        const hash = hashPin(pin);
        set({
          isSetup: true,
          pinHash: hash,
          pinLength: length,
          isAuthenticated: true,
          lastUnlocked: new Date().toISOString(),
          failedAttempts: 0,
        });
        persistNow();
      },

      // Vérifier le PIN et déverrouiller
      verifyAndUnlock: (pin: string): boolean => {
        const { pinHash, isLockedOut } = get();
        
        // Vérifier si bloqué
        if (isLockedOut()) {
          return false;
        }
        
        if (pinHash && verifyPin(pin, pinHash)) {
          set({
            isAuthenticated: true,
            lastUnlocked: new Date().toISOString(),
            failedAttempts: 0,
            lockoutUntil: null,
          });
          persistNow();
          return true;
        }
        
        // Échec - incrémenter les tentatives
        const newFailedAttempts = get().failedAttempts + 1;
        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          set({
            failedAttempts: newFailedAttempts,
            lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString(),
          });
        } else {
          set({ failedAttempts: newFailedAttempts });
        }
        persistNow();
        return false;
      },

      // Activer/désactiver la biométrie
      enableBiometric: (enabled: boolean) => {
        set({ biometricEnabled: enabled });
        persistNow();
      },

      // Déverrouiller avec biométrie
      unlockWithBiometric: () => {
        set({
          isAuthenticated: true,
          lastUnlocked: new Date().toISOString(),
          failedAttempts: 0,
        });
        persistNow();
      },

      // Verrouiller l'app
      lock: () => {
        set({ isAuthenticated: false });
      },

      // Changer le PIN
      changePin: (oldPin: string, newPin: string): boolean => {
        const { pinHash } = get();
        if (pinHash && verifyPin(oldPin, pinHash)) {
          const newHash = hashPin(newPin);
          set({
            pinHash: newHash,
            pinLength: newPin.length as 4 | 6,
          });
          persistNow();
          return true;
        }
        return false;
      },

      // Réinitialiser complètement
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
        });
        persistNow();
      },

      // Vérifier si bloqué
      isLockedOut: (): boolean => {
        const { lockoutUntil } = get();
        if (!lockoutUntil) return false;
        return new Date(lockoutUntil) > new Date();
      },
    }),
    {
      name: 'onyx-auth',
      storage: createJSONStorage(() => zustandStorage),
      // Ne pas persister isAuthenticated (toujours false au démarrage)
      partialize: (state) => ({
        isSetup: state.isSetup,
        pinHash: state.pinHash,
        pinLength: state.pinLength,
        biometricEnabled: state.biometricEnabled,
        lastUnlocked: state.lastUnlocked,
        failedAttempts: state.failedAttempts,
        lockoutUntil: state.lockoutUntil,
      }),
    }
  )
);
