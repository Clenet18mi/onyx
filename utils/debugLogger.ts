// ============================================
// ONYX - Debug Logger
// Capture les erreurs globales et la dernière erreur pour débogage (écran gris, crash)
// ============================================

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@onyx_debug_last_error';

export interface CapturedError {
  message: string;
  stack?: string;
  componentStack?: string;
  /** Rejet de promesse non géré */
  isPromiseRejection?: boolean;
  timestamp: string;
}

let lastError: CapturedError | null = null;
let initDone = false;

/** Récupère la dernière erreur capturée (mémoire + stockage) */
export async function getLastError(): Promise<CapturedError | null> {
  if (lastError) return lastError;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CapturedError;
      lastError = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Synchrone : dernière erreur en mémoire (peut être null au démarrage) */
export function getLastErrorSync(): CapturedError | null {
  return lastError;
}

/** Enregistre une erreur et la persiste pour affichage après redémarrage */
export function setLastError(error: unknown, options?: { componentStack?: string; isPromiseRejection?: boolean }) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const captured: CapturedError = {
    message,
    stack,
    componentStack: options?.componentStack,
    isPromiseRejection: options?.isPromiseRejection,
    timestamp: new Date().toISOString(),
  };
  lastError = captured;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(captured)).catch(() => {});
  if (__DEV__) {
    console.error('[ONYX] DebugLogger captured:', message, stack || '');
  }
}

/** Efface la dernière erreur stockée */
export async function clearLastError(): Promise<void> {
  lastError = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Initialise la capture des erreurs globales (à appeler une fois au démarrage) */
export function initDebugLogger() {
  if (initDone) return;
  initDone = true;

  // Erreurs synchrones et certaines erreurs non catchées par les Error Boundaries
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : undefined);
  const ErrorUtils = (g as any)?.ErrorUtils;
  if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
    const previous = ErrorUtils.getGlobalHandler?.() as ((err: unknown, isFatal?: boolean) => void) | undefined;
    ErrorUtils.setGlobalHandler((thrownValue: unknown, isFatal?: boolean) => {
      setLastError(thrownValue, { isPromiseRejection: false });
      if (__DEV__ && Platform.OS !== 'web') {
        const msg = thrownValue instanceof Error ? thrownValue.message : String(thrownValue);
        const stack = thrownValue instanceof Error ? thrownValue.stack : '';
        setTimeout(() => {
          const { Alert } = require('react-native');
          Alert.alert(
            'Erreur capturée (debug)',
            `${msg}\n\n${stack ? stack.slice(0, 300) + '...' : ''}`,
            [{ text: 'OK' }]
          );
        }, 100);
      }
      if (typeof previous === 'function') {
        previous(thrownValue, isFatal);
      }
    });
  }

  // Rejets de promesses non gérés (si disponible)
  const rejectionTracking = (g as any)?.HermesInternal?.enablePromiseRejectionTracker;
  if (typeof rejectionTracking === 'function') {
    try {
      rejectionTracking((event: { reason: unknown }) => {
        if (event?.reason != null) {
          setLastError(event.reason, { isPromiseRejection: true });
        }
      });
    } catch {
      // ignore
    }
  }
}
