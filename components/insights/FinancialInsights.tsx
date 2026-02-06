// ============================================
// ONYX - Financial Insights
// Prédictions, tendances, comparaisons
// ============================================

import React from 'react';
import { View, Text } from 'react-native';
import * as Icons from 'lucide-react-native';
import { useInsightsStore } from '@/stores/insightsStore';
import { useTransactionStore } from '@/stores';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { CATEGORIES } from '@/types';

export function FinancialInsights() {
  useTransactionStore((s) => s.transactions); // re-render when transactions change
  const getInsights = useInsightsStore((s) => s.getInsights);
  const insights = getInsights();

  const { endOfMonth, expenseComparison, incomeComparison, budgetAlert, categoryTrends, balanceIn7Days, balanceIn30Days } = insights;

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">🔮</Text>
        <Text className="text-white text-lg font-semibold">Prédictions & tendances</Text>
      </View>

      <GlassCard className="mb-4">
        <Text className="text-onyx-500 text-sm mb-2">Fin de mois prévu</Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-white">Dépenses prévues</Text>
          <Text className="text-accent-danger font-semibold">
            {formatCurrency(endOfMonth.predictedExpenses)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-white">Revenus prévus</Text>
          <Text className="text-accent-success font-semibold">
            {formatCurrency(endOfMonth.predictedIncome)}
          </Text>
        </View>
        <Text className="text-onyx-500 text-xs mt-1">
          Moyenne {formatCurrency(endOfMonth.dailyAverageSpending)}/jour • {endOfMonth.daysRemaining} jours restants
        </Text>
      </GlassCard>

      <GlassCard className="mb-4">
        <Text className="text-onyx-500 text-sm mb-2">Ce mois vs mois dernier</Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-white">Revenus</Text>
          <View className="flex-row items-center">
            {incomeComparison.variationPercent >= 0 ? (
              <Icons.TrendingUp size={14} color="#10B981" />
            ) : (
              <Icons.TrendingDown size={14} color="#EF4444" />
            )}
            <Text
              className="ml-1 font-medium"
              style={{ color: incomeComparison.variationPercent >= 0 ? '#10B981' : '#EF4444' }}
            >
              {incomeComparison.variationPercent >= 0 ? '+' : ''}
              {formatPercentage(incomeComparison.variationPercent)}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-white">Dépenses</Text>
          <View className="flex-row items-center">
            {expenseComparison.variationPercent <= 0 ? (
              <Icons.TrendingDown size={14} color="#10B981" />
            ) : (
              <Icons.TrendingUp size={14} color="#EF4444" />
            )}
            <Text
              className="ml-1 font-medium"
              style={{ color: expenseComparison.variationPercent <= 0 ? '#10B981' : '#EF4444' }}
            >
              {expenseComparison.variationPercent >= 0 ? '+' : ''}
              {formatPercentage(expenseComparison.variationPercent)}
            </Text>
          </View>
        </View>
      </GlassCard>

      {budgetAlert ? (
        <GlassCard className="mb-4" style={{ borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
          <View className="flex-row items-center">
            <Icons.AlertTriangle size={20} color="#F59E0B" />
            <Text className="text-amber-400 ml-2 flex-1">{budgetAlert}</Text>
          </View>
        </GlassCard>
      ) : null}

      <GlassCard className="mb-4">
        <Text className="text-onyx-500 text-sm mb-2">Projection solde</Text>
        <View className="flex-row justify-between">
          <Text className="text-white">Dans 7 jours</Text>
          <Text className={balanceIn7Days >= 0 ? 'text-accent-success' : 'text-accent-danger'}>
            {formatCurrency(balanceIn7Days)}
          </Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-white">Dans 30 jours</Text>
          <Text className={balanceIn30Days >= 0 ? 'text-accent-success' : 'text-accent-danger'}>
            {formatCurrency(balanceIn30Days)}
          </Text>
        </View>
      </GlassCard>

      {categoryTrends.length > 0 ? (
        <GlassCard>
          <Text className="text-onyx-500 text-sm mb-2">Catégories en mouvement</Text>
          {categoryTrends.slice(0, 3).map((ct) => {
            const cat = CATEGORIES.find((c) => c.id === ct.category);
            return (
              <View key={ct.category} className="flex-row justify-between items-center py-1">
                <Text className="text-white">{cat?.label ?? ct.category}</Text>
                <View className="flex-row items-center">
                  {ct.trend === 'up' && <Icons.TrendingUp size={12} color="#EF4444" />}
                  {ct.trend === 'down' && <Icons.TrendingDown size={12} color="#10B981" />}
                  <Text
                    className="ml-1 text-sm"
                    style={{
                      color: ct.trend === 'up' ? '#EF4444' : ct.trend === 'down' ? '#10B981' : '#71717A',
                    }}
                  >
                    {ct.variationPercent >= 0 ? '+' : ''}
                    {formatPercentage(ct.variationPercent)}
                  </Text>
                </View>
              </View>
            );
          })}
        </GlassCard>
      ) : null}
    </View>
  );
}
