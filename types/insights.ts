// ============================================
// ONYX - Types pour insights et prédictions
// ============================================

import type { TransactionCategory } from './index';

export interface MonthComparison {
  thisMonth: number;
  lastMonth: number;
  variationPercent: number;
  variationAmount: number;
}

export interface CategoryTrend {
  category: TransactionCategory;
  thisMonth: number;
  lastMonth: number;
  variationPercent: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface EndOfMonthPrediction {
  /** Dépenses prévues fin de mois (extrapolation) */
  predictedExpenses: number;
  /** Revenus prévus (connus ou moyenne) */
  predictedIncome: number;
  /** Moyenne journalière dépenses actuelle */
  dailyAverageSpending: number;
  /** Jours restants dans le mois */
  daysRemaining: number;
}

export interface BalanceProjection {
  date: string; // ISO
  projectedBalance: number;
  label?: string; // "Payday", "Netflix", etc.
}

export interface UnusualExpense {
  transactionId: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  description: string;
  /** Écart en nombre d'écarts-types au-dessus de la moyenne */
  zScore: number;
}

export interface FinancialInsightsData {
  /** Prédiction fin de mois */
  endOfMonth: EndOfMonthPrediction;
  /** Comparaison revenus/dépenses vs mois dernier */
  incomeComparison: MonthComparison;
  expenseComparison: MonthComparison;
  /** Top 3 catégories en hausse et en baisse */
  categoryTrends: CategoryTrend[];
  /** Dépenses inhabituelles (>2 écarts-types) */
  unusualExpenses: UnusualExpense[];
  /** Message alerte si rythme dépasse budget */
  budgetAlert: string | null;
  /** Projection solde dans 7, 15, 30 jours */
  balanceIn7Days: number;
  balanceIn15Days: number;
  balanceIn30Days: number;
}
