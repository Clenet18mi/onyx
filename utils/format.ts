// ============================================
// ONYX - Fonctions de Formatage
// ============================================

import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Parse une date ISO sans lever d'exception (retourne null si invalide). Utile après import. */
export function safeParseISO(dateString: string | undefined | null): Date | null {
  if (dateString == null || typeof dateString !== 'string') return null;
  try {
    const d = parseISO(dateString);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Formate un montant en devise
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Affiche un montant ou le masque en mode discret (••••• €)
 */
export function displayAmount(
  amount: number,
  privacyMode: boolean,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  if (privacyMode) return '••••• €';
  return formatCurrency(amount, currency, locale);
}

/**
 * Formate un montant de manière compacte (ex: 1.2K, 3.5M)
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'EUR'
): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1000000) {
    return `${sign}${(absAmount / 1000000).toFixed(1)}M ${currency}`;
  }
  if (absAmount >= 1000) {
    return `${sign}${(absAmount / 1000).toFixed(1)}K ${currency}`;
  }
  return formatCurrency(amount, currency);
}

/**
 * Formate une date de manière relative ou absolue (sûr : dates invalides → "—")
 */
export function formatDate(dateString: string | undefined | null): string {
  const date = safeParseISO(dateString);
  if (!date) return '—';
  
  if (isToday(date)) {
    return `Aujourd'hui, ${format(date, 'HH:mm', { locale: fr })}`;
  }
  
  if (isYesterday(date)) {
    return `Hier, ${format(date, 'HH:mm', { locale: fr })}`;
  }
  
  if (isThisWeek(date)) {
    return format(date, 'EEEE, HH:mm', { locale: fr });
  }
  
  if (isThisMonth(date)) {
    return format(date, 'd MMMM', { locale: fr });
  }
  
  return format(date, 'd MMM yyyy', { locale: fr });
}

/**
 * Formate une date en format court (sûr)
 */
export function formatShortDate(dateString: string | undefined | null): string {
  const date = safeParseISO(dateString);
  if (!date) return '—';
  return format(date, 'd MMM', { locale: fr });
}

/**
 * Formate une date en format long (sûr)
 */
export function formatLongDate(dateString: string | undefined | null): string {
  const date = safeParseISO(dateString);
  if (!date) return '—';
  return format(date, 'EEEE d MMMM yyyy', { locale: fr });
}

/**
 * Formate un temps relatif (sûr)
 */
export function formatRelativeTime(dateString: string | undefined | null): string {
  const date = safeParseISO(dateString);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calcule le pourcentage
 */
export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
}

/**
 * Retourne le signe + ou - selon le montant
 */
export function getAmountSign(amount: number): string {
  return amount >= 0 ? '+' : '';
}

/**
 * Formate un montant avec couleur (positif = vert, négatif = rouge)
 */
export function getAmountColor(amount: number): string {
  return amount >= 0 ? '#10B981' : '#EF4444';
}
