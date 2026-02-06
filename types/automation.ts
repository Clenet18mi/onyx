// ============================================
// ONYX - Règles d'automatisation
// ============================================

import type { TransactionCategory } from './index';

export type TriggerType =
  | 'amount_gt' | 'amount_lt' | 'amount_eq'
  | 'category' | 'account' | 'note_contains'
  | 'day_of_month' | 'day_of_week' | 'merchant';

export type ActionType =
  | 'set_category' | 'add_tag' | 'notify' | 'remind' | 'mark_important';

export interface Trigger {
  type: TriggerType;
  value: string | number; // category id, account id, text, day number...
}

export interface Action {
  type: ActionType;
  value?: string | number;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number; // ordre d'exécution
  triggers: Trigger[];
  actions: Action[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleExecutionLog {
  id: string;
  ruleId: string;
  transactionId: string;
  executedAt: string;
  result: 'applied' | 'skipped' | 'error';
}
