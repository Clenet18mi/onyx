// ============================================
// ONYX - Budget Assistant
// Suggestions de budgets à partir des 3 derniers mois
// ============================================

import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTransactionStore, useBudgetStore, useConfigStore } from '@/stores';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { safeParseISO } from '@/utils/format';
import type { TransactionCategory } from '@/types';

function roundSmart(value: number): number {
  if (value < 50) return Math.round(value / 5) * 5;
  if (value < 200) return Math.round(value / 10) * 10;
  return Math.round(value / 50) * 50;
}

export function BudgetAssistant() {
  const transactions = useTransactionStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);
  const addBudget = useBudgetStore((s) => s.addBudget);
  const getVisibleCategories = useConfigStore((s) => s.getVisibleCategories);
  const getCategoryById = useConfigStore((s) => s.getCategoryById);

  const suggestions = useMemo(() => {
    const now = new Date();
    const categoryIds = getVisibleCategories('expense').map((c) => c.id as TransactionCategory);
    return categoryIds.map((cat) => {
      const last3Months = [0, 1, 2].map((i) => {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        const txs = transactions.filter((t) => {
          const d = safeParseISO(t.date);
          return d != null && t.type === 'expense' && t.category === cat && isWithinInterval(d, { start: monthStart, end: monthEnd });
        });
        return txs.reduce((s, t) => s + t.amount, 0);
      }).filter((v) => v > 0);

      const avg = last3Months.length ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length : 0;
      const suggested = roundSmart(avg * 1.1); // +10% marge
      const existing = budgets.find((b) => b.category === cat);

      return {
        category: cat,
        label: getCategoryById(cat)?.label ?? cat,
        average: avg,
        suggested: suggested > 0 ? suggested : 250,
        currentLimit: existing?.limit,
      };
    }).filter((s) => s.average > 0 || s.currentLimit != null);
  }, [transactions, budgets, getVisibleCategories, getCategoryById]);

  const handleApplyAll = () => {
    suggestions.forEach((s) => {
      if (s.suggested > 0 && !budgets.some((b) => b.category === s.category)) {
        addBudget({
          category: s.category,
          limit: s.suggested,
          period: 'monthly',
          color: getCategoryById(s.category)?.color ?? '#6366F1',
        });
      }
    });
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: '#A8A8B3', fontSize: 14, marginBottom: 8 }}>Suggestions (moyenne 3 mois + 10%)</Text>
      <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
        {suggestions.map((s) => (
          <GlassCard key={s.category} padding="sm" style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{s.label}</Text>
                <Text style={{ color: '#71717A', fontSize: 12 }}>
                  Moy. {Math.round(s.average)}€ → suggéré {s.suggested}€
                </Text>
              </View>
              {!budgets.some((b) => b.category === s.category) && (
                <Button
                  title="Appliquer"
                  size="sm"
                  variant="primary"
                  onPress={() =>
                    addBudget({
                      category: s.category,
                      limit: s.suggested,
                      period: 'monthly',
                      color: getCategoryById(s.category)?.color ?? '#6366F1',
                    })
                  }
                />
              )}
            </View>
          </GlassCard>
        ))}
      </ScrollView>
      {suggestions.some((s) => !budgets.some((b) => b.category === s.category)) && (
        <Button title="Appliquer tout" variant="secondary" fullWidth onPress={handleApplyAll} style={{ marginTop: 8 }} />
      )}
    </View>
  );
}
