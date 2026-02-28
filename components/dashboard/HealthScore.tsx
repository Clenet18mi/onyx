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

  const { score, criteria } = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const txs = getTransactionsByDateRange(start.toISOString(), end.toISOString());

    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const progressList = getAllBudgetsProgress();
    const budgetsRespected = progressList.filter((p) => p.percentage <= 100).length;
    const totalBudgets = progressList.length;
    const budgetScore = totalBudgets === 0 ? 25 : (budgetsRespected / totalBudgets) * 25;

    const savingsScore = clamp((savingsRate / 20) * 25, 0, 25);

    const daysWithTx = new Set(txs.map((t) => format(parseISO(t.date), 'yyyy-MM-dd'))).size;
    const daysInMonth = 30;
    const regularityScore = clamp((daysWithTx / daysInMonth) * 25, 0, 25);

    const subsTotal = getTotalMonthlySubscriptions();
    const subsRatio = income > 0 ? (subsTotal / income) * 100 : 0;
    const subsScore = subsRatio <= 10 ? 25 : subsRatio <= 20 ? 15 : subsRatio <= 30 ? 10 : clamp(25 - subsRatio, 0, 25);

    const total = Math.round(budgetScore + savingsScore + regularityScore + subsScore);
    const score = clamp(total, 0, 100);

    return {
      score,
      criteria: [
        { label: 'Budgets respectés', detail: `${budgetsRespected}/${totalBudgets} dans la limite` },
        { label: 'Taux d\'épargne', detail: `${savingsRate.toFixed(1)} % ce mois` },
        { label: 'Régularité de saisie', detail: `${daysWithTx} jours avec au moins 1 transaction` },
        { label: 'Abonnements / revenus', detail: `${subsRatio.toFixed(0)} % des revenus` },
      ],
    };
  }, [getTransactionsByDateRange, getAllBudgetsProgress, getTotalMonthlySubscriptions]);

  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Bon' : score >= 40 ? 'Moyen' : 'À améliorer';

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
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{
              backgroundColor: score >= 80 ? 'rgba(16,185,129,0.2)' : score >= 60 ? 'rgba(99,102,241,0.2)' : score >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
              borderWidth: 3,
              borderColor: score >= 80 ? '#10B981' : score >= 60 ? '#6366F1' : score >= 40 ? '#F59E0B' : '#EF4444',
            }}
          >
            <Text className="text-white text-xl font-bold">{score}</Text>
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
              <View key={c.label} className="flex-row justify-between items-center py-1">
                <Text className="text-onyx-500 text-sm">{c.label}</Text>
                <Text className="text-white text-sm">{c.detail}</Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}
