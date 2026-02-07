// ============================================
// ONYX - Vérification intégrité des données
// ============================================

import { useAccountStore } from '@/stores/accountStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { CATEGORIES } from '@/types';

export interface IntegrityReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    accounts: number;
    transactions: number;
    orphanedTransactions: number;
    inconsistentBalances: number;
  };
}

export function checkDataIntegrity(): IntegrityReport {
  const report: IntegrityReport = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      accounts: 0,
      transactions: 0,
      orphanedTransactions: 0,
      inconsistentBalances: 0,
    },
  };

  const accounts = useAccountStore.getState().accounts;
  const transactions = useTransactionStore.getState().transactions;
  const budgets = useBudgetStore.getState().budgets;

  report.stats.accounts = accounts.length;
  report.stats.transactions = transactions.length;

  const accountIds = new Set(accounts.map((a) => a.id));
  const orphaned = transactions.filter((t) => !accountIds.has(t.accountId));
  if (orphaned.length > 0) {
    report.valid = false;
    report.errors.push(`${orphaned.length} transaction(s) orpheline(s) (compte supprimé)`);
    report.stats.orphanedTransactions = orphaned.length;
  }

  const transactionIds = transactions.map((t) => t.id);
  const uniqueIds = new Set(transactionIds);
  if (transactionIds.length !== uniqueIds.size) {
    report.valid = false;
    report.errors.push('ID de transactions en double détectés');
  }

  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  const orphanedBudgets = budgets.filter((b) => !categoryIds.has(b.category));
  if (orphanedBudgets.length > 0) {
    report.warnings.push(`${orphanedBudgets.length} budget(s) pour catégories supprimées ou invalides`);
  }

  for (const account of accounts) {
    const fromThisAccount = transactions.filter((t) => t.accountId === account.id);
    const toThisAccount = transactions.filter((t) => t.toAccountId === account.id);
    let expected = 0;
    for (const t of fromThisAccount) {
      if (t.type === 'income') expected += t.amount;
      else if (t.type === 'expense') expected -= t.amount;
      else if (t.type === 'transfer' && t.toAccountId) expected -= t.amount;
    }
    for (const t of toThisAccount) expected += t.amount;
    const diff = Math.abs(account.balance - expected);
    if (diff > 0.01) {
      report.warnings.push(
        `Compte "${account.name}" : solde incohérent (attendu: ${expected.toFixed(2)}€, actuel: ${account.balance.toFixed(2)}€)`
      );
      report.stats.inconsistentBalances++;
    }
  }

  return report;
}

/**
 * Répare automatiquement les problèmes détectés (transactions orphelines, soldes)
 */
export function autoRepairData(report: IntegrityReport): void {
  const accountIds = new Set(useAccountStore.getState().accounts.map((a) => a.id));

  if (report.stats.orphanedTransactions > 0) {
    useTransactionStore.setState((state) => ({
      transactions: state.transactions.filter((t) => accountIds.has(t.accountId)),
    }));
  }

  if (report.stats.inconsistentBalances > 0) {
    const accounts = useAccountStore.getState().accounts;
    const transactions = useTransactionStore.getState().transactions;
    for (const account of accounts) {
      const fromThis = transactions.filter((t) => t.accountId === account.id);
      const toThis = transactions.filter((t) => t.toAccountId === account.id);
      let expected = 0;
      for (const t of fromThis) {
        if (t.type === 'income') expected += t.amount;
        else if (t.type === 'expense') expected -= t.amount;
        else if (t.type === 'transfer' && t.toAccountId) expected -= t.amount;
      }
      for (const t of toThis) expected += t.amount;
      useAccountStore.getState().updateAccount(account.id, { balance: expected });
    }
  }
}
