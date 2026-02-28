// ============================================
// ONYX - Spending Trends
// Tendances de dépenses par catégorie (mois en cours vs 2 mois précédents)
// ============================================

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTransactionStore, useConfigStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';

export function SpendingTrends() {
  const transactions = useTransactionStore((s) => s.transactions);
  const getCategoryById = useConfigStore((s) => s.getCategoryById);

  const { lines, hasEnoughHistory } = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const prev1Start = startOfMonth(subMonths(now, 1));
    const prev1End = endOfMonth(subMonths(now, 1));
    const prev2Start = startOfMonth(subMonths(now, 2));
    const prev2End = endOfMonth(subMonths(now, 2));

    const expense = (start: Date, end: Date) =>
      transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            isWithinInterval(parseISO(t.date), { start, end })
        )
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

    const current = expense(thisMonthStart, thisMonthEnd);
    const prev1 = expense(prev1Start, prev1End);
    const prev2 = expense(prev2Start, prev2End);

    const hasDataPrev1 = Object.keys(prev1).length > 0 || Object.values(prev1).some((v) => v > 0);
    const hasDataPrev2 = Object.keys(prev2).length > 0 || Object.values(prev2).some((v) => v > 0);
    const hasEnoughHistory = hasDataPrev1 || hasDataPrev2;

    if (!hasEnoughHistory) return { lines: [], hasEnoughHistory: false };

    const allCategories = new Set([...Object.keys(current), ...Object.keys(prev1), ...Object.keys(prev2)]);
    const trends: { categoryId: string; current: number; avgPrev: number; variation: number }[] = [];

    allCategories.forEach((catId) => {
      const cur = current[catId] || 0;
      const p1 = prev1[catId] || 0;
      const p2 = prev2[catId] || 0;
      const avgPrev = (p1 + p2) / 2;
      if (avgPrev === 0 && cur === 0) return;
      const variation = avgPrev > 0 ? ((cur - avgPrev) / avgPrev) * 100 : (cur > 0 ? 100 : 0);
      if (Math.abs(variation) > 20) {
        trends.push({ categoryId: catId, current: cur, avgPrev, variation });
      }
    });

    trends.sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation));
    const top = trends.slice(0, 3);
    const lines = top.map((t) => {
      const cat = getCategoryById(t.categoryId);
      return {
        label: cat?.label ?? t.categoryId,
        current: t.current,
        avgPrev: t.avgPrev,
        variation: t.variation,
      };
    });

    return { lines, hasEnoughHistory: true };
  }, [transactions, getCategoryById]);

  if (!hasEnoughHistory) return null;

  return (
    <View className="mb-6">
      <GlassCard>
        <Text className="text-white text-base font-semibold mb-3">Tendances de dépenses</Text>
        {lines.length === 0 ? (
          <Text className="text-onyx-500 text-sm">📊 Tes dépenses sont stables ce mois-ci. Bien joué !</Text>
        ) : (
          lines.map((line, i) => (
            <View key={i} className="mb-2 last:mb-0">
              <Text className="text-white text-sm">
                {line.variation > 0 ? '🔴' : '🟢'} {line.label} {line.variation > 0 ? '+' : ''}
                {line.variation.toFixed(0)}% ce mois-ci ({formatCurrency(line.current)} vs {formatCurrency(line.avgPrev)} en moyenne)
              </Text>
            </View>
          ))
        )}
      </GlassCard>
    </View>
  );
}
