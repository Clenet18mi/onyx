// ============================================
// ONYX - Gestionnaire d'erreurs centralisé
// ============================================

import { Alert } from 'react-native';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

interface ErrorOptions {
  severity?: ErrorSeverity;
  userMessage?: string;
  showAlert?: boolean;
  logToConsole?: boolean;
}

function getDefaultErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Une erreur inattendue s'est produite.";
}

/**
 * Gestionnaire d'erreurs centralisé
 */
export function handleError(
  error: unknown,
  context: string,
  options: Partial<ErrorOptions> = {}
): void {
  const {
    severity = ErrorSeverity.ERROR,
    userMessage,
    showAlert = true,
    logToConsole = true,
  } = options;

  if (logToConsole || __DEV__) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] ${severity}:`, msg);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  if (showAlert && severity !== ErrorSeverity.INFO) {
    const title = severity === ErrorSeverity.CRITICAL ? "Erreur critique" : "Erreur";
    const message = userMessage ?? getDefaultErrorMessage(error);
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
}

/**
 * Wrapper pour fonctions async avec gestion d'erreurs
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  options?: Partial<ErrorOptions>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, options);
      throw error;
    }
  }) as T;
}
