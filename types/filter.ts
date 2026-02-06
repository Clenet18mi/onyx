// ============================================
// ONYX - Filtres sauvegardés
// ============================================

import type { TransactionCategory } from './index';

export type PeriodPreset =
  | 'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';

export type SortField = 'date' | 'amount' | 'description' | 'category';
export type SortOrder = 'asc' | 'desc';

export interface SavedFilter {
  id: string;
  name: string;
  period: PeriodPreset;
  customStart?: string;
  customEnd?: string;
  accountIds: string[];
  categoryIds: TransactionCategory[];
  types: ('income' | 'expense' | 'transfer')[];
  amountMin?: number;
  amountMax?: number;
  searchQuery: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  createdAt: string;
}
