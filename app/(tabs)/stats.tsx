// ============================================
// ONYX - Statistiques
// Graphiques et analyses
// ============================================

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { BarChart } from 'react-native-gifted-charts';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTransactionStore, useAccountStore } from '@/stores';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { CATEGORIES } from '@/types';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const transactions = useTransactionStore((state) => state.transactions);
  const accounts = useAccountStore((state) => state.accounts);

  const range = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return { start, end };
  }, [selectedMonth]);

  const filteredTx = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = parseISO(tx.date);
        return isWithinInterval(d, { start: range.start, end: range.end });
      }),
    [transactions, range]
  );

  const income = useMemo(
    () => filteredTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filteredTx]
  );
  const expenses = useMemo(
    () => filteredTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filteredTx]
  );
  const balance = income - expenses;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([catId, amount]) => ({ catId, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [filteredTx]);

  const chartData = useMemo(() => {
    return byCategory.map(({ catId, amount }) => {
      const cat = CATEGORIES.find((c) => c.id === catId);
      const pct = expenses > 0 ? (amount / expenses) * 100 : 0;
      return {
        value: amount,
        label: cat?.label?.slice(0, 6) || catId.slice(0, 6),
        frontColor: cat?.color || '#6366F1',
        topLabelComponent: () => (
          <Text style={{ color: '#A1A1AA', fontSize: 10 }}>{formatCurrency(amount)}</Text>
        ),
      };
    });
  }, [byCategory, expenses]);

  const monthOptions = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, 11);
    return eachMonthOfInterval({ start, end }).reverse();
  }, []);

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 pt-4 pb-2">
          <Text className="text-white text-2xl font-bold">Statistiques</Text>
          <Text className="text-onyx-500 text-sm mt-1">
            Revenus, dépenses et répartition par catégorie
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Mois */}
          <View className="px-6 mb-4">
            <Text className="text-onyx-500 text-sm mb-2">Période</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{ gap: 8 }}>
                {monthOptions.map((d) => {
                  const isSelected =
                    d.getMonth() === selectedMonth.getMonth() &&
                    d.getFullYear() === selectedMonth.getFullYear();
                  return (
                    <TouchableOpacity
                      key={d.toISOString()}
                      onPress={() => setSelectedMonth(d)}
                      className="px-4 py-2 rounded-xl"
                      style={{
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text
                        className="font-medium"
                        style={{ color: isSelected ? '#fff' : '#71717A' }}
                      >
                        {format(d, 'MMM yyyy', { locale: fr })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Résumé */}
          <View className="px-6 mb-6">
            <View className="flex-row" style={{ gap: 12 }}>
              <GlassCard className="flex-1">
                <Icons.TrendingUp size={20} color="#10B981" />
                <Text className="text-onyx-500 text-xs mt-1">Revenus</Text>
                <Text className="text-white text-lg font-bold" style={{ color: '#10B981' }}>
                  {formatCurrency(income)}
                </Text>
              </GlassCard>
              <GlassCard className="flex-1">
                <Icons.TrendingDown size={20} color="#EF4444" />
                <Text className="text-onyx-500 text-xs mt-1">Dépenses</Text>
                <Text className="text-white text-lg font-bold" style={{ color: '#EF4444' }}>
                  {formatCurrency(expenses)}
                </Text>
              </GlassCard>
              <GlassCard className="flex-1">
                <Icons.Wallet size={20} color="#6366F1" />
                <Text className="text-onyx-500 text-xs mt-1">Solde</Text>
                <Text
                  className="text-lg font-bold"
                  style={{ color: balance >= 0 ? '#10B981' : '#EF4444' }}
                >
                  {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                </Text>
              </GlassCard>
            </View>
          </View>

          {/* Graphique par catégorie */}
          {chartData.length > 0 && (
            <View className="px-6 mb-6">
              <Text className="text-white font-semibold mb-3">Dépenses par catégorie</Text>
              <GlassCard>
                <BarChart
                  data={chartData}
                  barWidth={Math.min(32, (width - 80) / chartData.length - 8)}
                  spacing={8}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisColor="transparent"
                  yAxisColor="rgba(255,255,255,0.1)"
                  yAxisTextStyle={{ color: '#71717A', fontSize: 10 }}
                  noOfSections={4}
                  maxValue={Math.max(...chartData.map((d) => d.value)) * 1.2}
                  showVerticalLines={false}
                  initialSpacing={8}
                  endSpacing={8}
                />
              </GlassCard>
            </View>
          )}

          {/* Liste catégories */}
          <View className="px-6 mb-8">
            <Text className="text-white font-semibold mb-3">Détail des catégories</Text>
            {byCategory.map(({ catId, amount }) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              const pct = expenses > 0 ? (amount / expenses) * 100 : 0;
              const Icon = cat ? (Icons as any)[cat.icon] : Icons.CircleDot;
              return (
                <View
                  key={catId}
                  className="flex-row items-center py-3"
                  style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: `${cat?.color || '#6366F1'}20` }}
                  >
                    <Icon size={20} color={cat?.color || '#6366F1'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{cat?.label || catId}</Text>
                    <Text className="text-onyx-500 text-xs">{formatPercentage(pct)}</Text>
                  </View>
                  <Text className="text-white font-semibold">{formatCurrency(amount)}</Text>
                </View>
              );
            })}
            {byCategory.length === 0 && (
              <Text className="text-onyx-500 py-6 text-center">Aucune dépense sur cette période</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
