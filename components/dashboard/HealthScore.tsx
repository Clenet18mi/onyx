// ============================================
// ONYX - Financial Health Score
// Score 0–100 basé sur 4 critères (25 pts chacun)
// ============================================

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Icons from 'lucide-react-native';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { useTransactionStore, useBudgetStore, useSubscriptionStore } from '@/stores';
import { GlassCard } from '../ui/GlassCard';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HealthScore() {
  const [expanded, setExpanded] = useState(false);

  const getTransactionsByDateRange = useTransactionStore((s) => s.getTransactionsByDateRange);
  const getAllBudgetsProgress = useBudgetStore((s) => s.getAllBudgetsProgress);
  const getTotalMonthlySubscriptions = useSubscriptionStore((s) => s.getTotalMonthlySubscriptions);

  const { score, criteria, label } = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const txs = getTransactionsByDateRange(start.toISOString(), end.toISOString())
      .filter((t) => t.type !== 'transfer');

    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const progressList = getAllBudgetsProgress();
    const totalBudgets = progressList.length;
    const overCount = progressList.filter((p) => p.percentage > 100).length;
    const pctOver = totalBudgets > 0 ? (overCount / totalBudgets) * 100 : 0;
    let c1 = 0;
    if (totalBudgets === 0) c1 = 25;
    else if (pctOver <= 25) c1 = 15;
    else c1 = 0;

    let c2 = 0;
    if (savingsRate >= 20) c2 = 25;
    else if (savingsRate >= 10) c2 = 15;
    else if (savingsRate >= 0) c2 = 5;
    else c2 = 0;

    const daysWithTx = new Set(txs.map((t) => format(parseISO(t.date), 'yyyy-MM-dd'))).size;
    let c3 = 0;
    if (daysWithTx >= 15) c3 = 25;
    else if (daysWithTx >= 7) c3 = 15;
    else c3 = 5;

    const subsTotal = getTotalMonthlySubscriptions();
    const subsRatio = income > 0 ? (subsTotal / income) * 100 : 0;
    let c4 = 0;
    if (subsRatio < 15) c4 = 25;
    else if (subsRatio <= 30) c4 = 15;
    else c4 = 0;

    const total = Math.round(c1 + c2 + c3 + c4);
    const score = clamp(total, 0, 100);

    const label =
      score >= 80
        ? '🟢 Excellente santé financière'
        : score >= 60
          ? '🟡 Bonne trajectoire'
          : score >= 40
            ? '🟠 Quelques points à améliorer'
            : '🔴 Attention requise';

    return {
      score,
      label,
      criteria: [
        { label: 'Budgets respectés', score: c1, max: 25, detail: totalBudgets === 0 ? 'Aucun budget' : `${overCount} dépassé(s), ${totalBudgets - overCount} dans la limite` },
        { label: "Taux d'épargne du mois", score: c2, max: 25, detail: `${savingsRate.toFixed(1)} %` },
        { label: 'Régularité de saisie', score: c3, max: 25, detail: `${daysWithTx} jours avec au moins 1 transaction` },
        { label: 'Poids des abonnements', score: c4, max: 25, detail: `${subsRatio.toFixed(0)} % des revenus` },
      ],
    };
  }, [getTransactionsByDateRange, getAllBudgetsProgress, getTotalMonthlySubscriptions]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => setExpanded(!expanded)}>
      <GlassCard variant="light">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
            >
              <Icons.Activity size={28} color="#6366F1" />
            </View>
            <View>
              <Text className="text-white text-lg font-semibold">Santé financière</Text>
              <Text className="text-onyx-500 text-sm">{label}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-white text-3xl font-bold">{score}</Text>
            <Text className="text-onyx-500 text-xs">/ 100</Text>
          </View>
        </View>

        <View className="mt-3 h-2 rounded-full overflow-hidden bg-onyx-200/20">
          <View
            className="h-full rounded-full"
            style={{
              width: `${score}%`,
              backgroundColor: score >= 80 ? '#10B981' : score >= 60 ? '#6366F1' : score >= 40 ? '#F59E0B' : '#EF4444',
            }}
          />
        </View>

        {expanded && (
          <View className="mt-4 pt-4 border-t border-onyx-200/20">
            {criteria.map((c) => (
              <View key={c.label} className="flex-row justify-between items-center py-2">
                <Text className="text-onyx-500 text-sm flex-1">{c.label}</Text>
                <Text className="text-white text-sm font-medium mr-2">{c.score}/{c.max} pts</Text>
                <Text className="text-onyx-400 text-xs">{c.detail}</Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}
