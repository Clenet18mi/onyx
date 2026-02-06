// ============================================
// ONYX - Templates de transactions
// ============================================

import type { TransactionCategory } from './index';

export interface TransactionTemplate {
  id: string;
  name: string;
  type: 'income' | 'expense';
  category: TransactionCategory;
  accountId: string;
  /** Montant fixe ou null si variable */
  amount: number | null;
  note: string;
  /** Variables supportées: {montant}, {date}, {mois} */
  createdAt: string;
  updatedAt: string;
  order: number;
}
