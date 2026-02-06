// ============================================
// ONYX - Insights Store
// Calculs dérivés : prédictions, tendances, comparaisons
// ============================================

import { create } from 'zustand';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  isWithinInterval,
  differenceInDays,
  getDate,
  addDays,
} from 'date-fns';
import { useTransactionStore } from './transactionStore';
import { useAccountStore } from './accountStore';
import { useBudgetStore } from './budgetStore';
import { useConfigStore } from './configStore';
import { useSubscriptionStore } from './subscriptionStore';
import type {
  FinancialInsightsData,
  EndOfMonthPrediction,
  MonthComparison,
  CategoryTrend,
  UnusualExpense,
} from '@/types/insights';
import type { TransactionCategory } from '@/types';

function getTransactions() {
  return useTransactionStore.getState().transactions;
}

function computeMonthComparison(
  thisMonthTotal: number,
  lastMonthTotal: number
): MonthComparison {
  const variationAmount = thisMonthTotal - lastMonthTotal;
  const variationPercent =
    lastMonthTotal === 0
      ? (thisMonthTotal > 0 ? 100 : 0)
      : (variationAmount / lastMonthTotal) * 100;
  return {
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    variationPercent,
    variationAmount,
  };
}

export function computeFinancialInsights(): FinancialInsightsData {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const transactions = getTransactions();

  const thisMonthTx = transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
  });
  const lastMonthTx = transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
  });

  const thisMonthIncome = thisMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const thisMonthExpenses = thisMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const lastMonthIncome = lastMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const lastMonthExpenses = lastMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const daysElapsed = getDate(now);
  const lastDayOfMonth = getDate(endOfMonth(now));
  const daysRemaining = lastDayOfMonth - daysElapsed;
  const dailyAverageSpending = daysElapsed > 0 ? thisMonthExpenses / daysElapsed : 0;
  const predictedExpenses = thisMonthExpenses + dailyAverageSpending * daysRemaining;
  const salaryDay = useConfigStore.getState().profile.salaryDay;
  const defaultSalaryAmount = useConfigStore.getState().profile.defaultSalaryAmount ?? 0;
  const hasSalaryThisMonth = salaryDay != null && getDate(now) <= salaryDay;
  const predictedIncome = thisMonthIncome + (hasSalaryThisMonth && defaultSalaryAmount ? defaultSalaryAmount : 0);

  const endOfMonthData: EndOfMonthPrediction = {
    predictedExpenses,
    predictedIncome,
    dailyAverageSpending,
    daysRemaining,
  };

  const incomeComparison = computeMonthComparison(thisMonthIncome, lastMonthIncome);
  const expenseComparison = computeMonthComparison(thisMonthExpenses, lastMonthExpenses);

  // Catégories : variation ce mois vs dernier
  const categories = [
    'food', 'transport', 'housing', 'utilities', 'entertainment', 'shopping',
    'health', 'education', 'travel', 'subscriptions', 'insurance', 'other',
  ] as TransactionCategory[];

  const categoryTrends: CategoryTrend[] = categories
    .map((cat) => {
      const thisVal = thisMonthTx.filter((t) => t.category === cat && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const lastVal = lastMonthTx.filter((t) => t.category === cat && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const variation = lastVal === 0 ? (thisVal > 0 ? 100 : 0) : ((thisVal - lastVal) / lastVal) * 100;
      return {
        category: cat,
        thisMonth: thisVal,
        lastMonth: lastVal,
        variationPercent: variation,
        trend: variation > 5 ? 'up' : variation < -5 ? 'down' : 'neutral',
      };
    })
    .filter((c) => c.thisMonth > 0 || c.lastMonth > 0)
    .sort((a, b) => Math.abs(b.variationPercent) - Math.abs(a.variationPercent))
    .slice(0, 6);

  // Dépenses inhabituelles (écart-type)
  const expenseAmounts = thisMonthTx.filter((t) => t.type === 'expense').map((t) => t.amount);
  const mean = expenseAmounts.length ? expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length : 0;
  const variance = expenseAmounts.length
    ? expenseAmounts.reduce((s, x) => s + (x - mean) ** 2, 0) / expenseAmounts.length
    : 0;
  const std = Math.sqrt(variance) || 1;
  const unusualExpenses: UnusualExpense[] = thisMonthTx
    .filter((t) => t.type === 'expense' && t.amount > mean + 2 * std)
    .map((t) => ({
      transactionId: t.id,
      amount: t.amount,
      category: t.category,
      date: t.date,
      description: t.description,
      zScore: (t.amount - mean) / std,
    }))
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, 5);

  // Budget alert
  const budgetsProgress = useBudgetStore.getState().getAllBudgetsProgress();
  const overBudget = budgetsProgress.filter((b) => b.percentage > 100);
  const budgetAlert =
    overBudget.length > 0
      ? `Budget${overBudget.length > 1 ? 's' : ''} dépassé(s) : ${overBudget.map((b) => b.category).join(', ')}`
      : dailyAverageSpending > 0 && predictedExpenses > thisMonthIncome
        ? `À ce rythme, tes dépenses prévues (${Math.round(predictedExpenses)}€) dépassent tes revenus ce mois.`
        : null;

  // Projection solde
  const totalBalance = useAccountStore.getState().getTotalBalance();
  const subs = useSubscriptionStore.getState().subscriptions.filter((s) => s.isActive);
  const avgDaily = dailyAverageSpending;
  const salaryAmount = useConfigStore.getState().profile.defaultSalaryAmount ?? 0;

  const projectBalance = (daysAhead: number): number => {
    let balance = totalBalance;
    balance -= avgDaily * daysAhead;
    if (salaryDay != null && salaryAmount > 0) {
      const dayOfMonth = getDate(now);
      const daysUntilSalary = salaryDay >= dayOfMonth ? salaryDay - dayOfMonth : lastDayOfMonth - dayOfMonth + salaryDay;
      if (daysUntilSalary >= 0 && daysUntilSalary <= daysAhead) balance += salaryAmount;
    }
    subs.forEach((sub) => {
      const next = parseISO(sub.nextBillingDate);
      const daysUntil = differenceInDays(next, now);
      if (daysUntil >= 0 && daysUntil <= daysAhead) balance -= sub.amount;
    });
    return Math.round(balance * 100) / 100;
  };

  return {
    endOfMonth: endOfMonthData,
    incomeComparison,
    expenseComparison,
    categoryTrends,
    unusualExpenses,
    budgetAlert,
    balanceIn7Days: projectBalance(7),
    balanceIn15Days: projectBalance(15),
    balanceIn30Days: projectBalance(30),
  };
}

interface InsightsState {
  /** Recalcul à la demande (pas de persistance) */
  getInsights: () => FinancialInsightsData;
}

export const useInsightsStore = create<InsightsState>(() => ({
  getInsights: computeFinancialInsights,
}));
