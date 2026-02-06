// ============================================
// ONYX - Partage de dépense (Split Bill)
// ============================================

export type SplitMode = 'equal' | 'custom' | 'percentage';

export interface SplitParticipant {
  id: string;
  name: string;
  amount: number;
  paid: boolean; // remboursé
  paidAt?: string;
}

export interface SplitBill {
  id: string;
  transactionId: string;
  totalAmount: number;
  mode: SplitMode;
  participants: SplitParticipant[];
  createdAt: string;
  updatedAt: string;
}
