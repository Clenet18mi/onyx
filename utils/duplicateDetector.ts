// ============================================
// ONYX - Détection de doublons
// Alerte avant d'ajouter une transaction similaire
// ============================================

import { parseISO, differenceInCalendarDays } from 'date-fns';
import type { Transaction, TransactionCategory } from '@/types';

export interface DuplicateCandidate {
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  category: TransactionCategory;
  amount: number;
  description?: string;
  date: string; // ISO
}

export interface DuplicateMatch {
  transaction: Transaction;
  score: number; // 0-100
  amountDiff: number; // en %
  dateDiff: number; // jours
}

const AMOUNT_TOLERANCE_PERCENT = 5;
const DATE_TOLERANCE_DAYS = 1;
const SCORE_THRESHOLD = 85;
const AMOUNT_WEIGHT = 0.7;
const CATEGORY_WEIGHT = 0.2;
const DATE_WEIGHT = 0.1;

/** Score de similarité montant : 100 si identique, 0 si >5% d'écart */
function amountScore(candidateAmount: number, existingAmount: number): number {
  if (existingAmount === 0) return candidateAmount === 0 ? 100 : 0;
  const diff = Math.abs(candidateAmount - existingAmount);
  const pct = (diff / Math.abs(existingAmount)) * 100;
  if (pct <= AMOUNT_TOLERANCE_PERCENT) {
    return 100 - (pct / AMOUNT_TOLERANCE_PERCENT) * 30; // 70-100
  }
  return Math.max(0, 100 - pct);
}

/** Score catégorie : 100 si identique, 0 sinon */
function categoryScore(candidate: TransactionCategory, existing: TransactionCategory): number {
  return candidate === existing ? 100 : 0;
}

/** Score date : 100 si même jour, décroît jusqu'à ±1 jour */
function dateScore(candidateDate: string, existingDate: string): number {
  const days = Math.abs(differenceInCalendarDays(parseISO(candidateDate), parseISO(existingDate)));
  if (days === 0) return 100;
  if (days <= DATE_TOLERANCE_DAYS) return 70;
  return Math.max(0, 70 - days * 20);
}

/**
 * Trouve les transactions similaires dans la liste (7 derniers jours par défaut).
 * Retourne les correspondances avec score >= seuil.
 */
export function findSimilarTransactions(
  candidate: DuplicateCandidate,
  existingTransactions: Transaction[],
  options: {
    lookbackDays?: number;
    threshold?: number;
    excludeIds?: string[];
  } = {}
): DuplicateMatch[] {
  const { lookbackDays = 7, threshold = SCORE_THRESHOLD, excludeIds = [] } = options;
  const candidateDate = parseISO(candidate.date);
  const cutoff = new Date(candidateDate);
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const recent = existingTransactions.filter((tx) => {
    if (excludeIds.includes(tx.id)) return false;
    const txDate = parseISO(tx.date);
    if (txDate < cutoff) return false;
    if (tx.type !== candidate.type) return false;
    return true;
  });

  const matches: DuplicateMatch[] = [];

  for (const tx of recent) {
    const amtScore = amountScore(candidate.amount, tx.amount);
    const catScore = categoryScore(candidate.category, tx.category);
    const dScore = dateScore(candidate.date, tx.date);

    const score = amtScore * AMOUNT_WEIGHT + catScore * CATEGORY_WEIGHT + dScore * DATE_WEIGHT;
    const amountDiff = tx.amount === 0 ? 0 : ((candidate.amount - tx.amount) / tx.amount) * 100;
    const dateDiff = differenceInCalendarDays(parseISO(candidate.date), parseISO(tx.date));

    if (score >= threshold) {
      matches.push({
        transaction: tx,
        score: Math.round(score),
        amountDiff,
        dateDiff,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

/** Génère une signature pour "ne plus alerter pour ce type" (catégorie + fourchette de montant) */
export function getDuplicateIgnoreSignature(candidate: DuplicateCandidate): string {
  const amountBucket = Math.floor(candidate.amount / 10) * 10; // ex: 23 -> 20, 47 -> 40
  return `${candidate.type}|${candidate.category}|${amountBucket}`;
}
