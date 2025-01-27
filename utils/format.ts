// ============================================
// ONYX - Fonctions de Formatage
// ============================================

import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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
 * Formate une date de manière relative ou absolue
 */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  
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
 * Formate une date en format court
 */
export function formatShortDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'd MMM', { locale: fr });
}

/**
 * Formate une date en format long
 */
export function formatLongDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'EEEE d MMMM yyyy', { locale: fr });
}

/**
 * Formate un temps relatif (il y a X minutes/heures/jours)
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
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
