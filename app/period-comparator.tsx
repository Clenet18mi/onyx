// ============================================
// ONYX - Comparateur de périodes
// Comparer deux mois (revenus, dépenses, solde)
// ============================================

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTransactionStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PeriodComparatorScreen() {
  const router = useRouter();
  const [monthA, setMonthA] = useState(subMonths(new Date(), 1));
  const [monthB, setMonthB] = useState(new Date());
  const transactions = useTransactionStore((state) => state.transactions);

  const stats = useMemo(() => {
    const range = (d: Date) => ({
      start: startOfMonth(d),
      end: endOfMonth(d),
    });
    const filter = (start: Date, end: Date) =>
      transactions.filter((tx) => {
        const t = parseISO(tx.date);
        return isWithinInterval(t, { start, end });
      });
    const ra = range(monthA);
    const rb = range(monthB);
    const txA = filter(ra.start, ra.end);
    const txB = filter(rb.start, rb.end);
    const income = (tx: typeof transactions) =>
      tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = (tx: typeof transactions) =>
      tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      incomeA: income(txA),
      incomeB: income(txB),
      expensesA: expenses(txA),
      expensesB: expenses(txB),
      balanceA: income(txA) - expenses(txA),
      balanceB: income(txB) - expenses(txB),
    };
  }, [transactions, monthA, monthB]);

  const diffIncome = stats.incomeB - stats.incomeA;
  const diffExpenses = stats.expensesB - stats.expensesA;
  const diffBalance = stats.balanceB - stats.balanceA;

  const MonthSelector = ({
    value,
    onChange,
    label,
  }: {
    value: Date;
    onChange: (d: Date) => void;
    label: string;
  }) => (
    <View className="mb-4">
      <Text className="text-onyx-500 text-sm mb-2">{label}</Text>
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onChange(subMonths(value, 1))}
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <Icons.ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          {format(value, 'MMMM yyyy', { locale: fr })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            const next = subMonths(value, -1);
            if (next <= new Date()) onChange(next);
          }}
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <Icons.ChevronRight size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-6 py-4 border-b border-onyx-200/10">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.ArrowLeft size={24} color="#71717A" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Comparer périodes</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
          <MonthSelector value={monthA} onChange={setMonthA} label="Période A" />
          <MonthSelector value={monthB} onChange={setMonthB} label="Période B" />

          <View className="flex-row mb-4" style={{ gap: 12 }}>
            <GlassCard className="flex-1">
              <Text className="text-onyx-500 text-xs">Revenus A</Text>
              <Text className="text-white text-lg font-bold" style={{ color: '#10B981' }}>
                {formatCurrency(stats.incomeA)}
              </Text>
            </GlassCard>
            <GlassCard className="flex-1">
              <Text className="text-onyx-500 text-xs">Revenus B</Text>
              <Text className="text-white text-lg font-bold" style={{ color: '#10B981' }}>
                {formatCurrency(stats.incomeB)}
              </Text>
            </GlassCard>
          </View>
          <View className="flex-row mb-4" style={{ gap: 12 }}>
            <GlassCard className="flex-1">
              <Text className="text-onyx-500 text-xs">Dépenses A</Text>
              <Text className="text-white text-lg font-bold" style={{ color: '#EF4444' }}>
                {formatCurrency(stats.expensesA)}
              </Text>
            </GlassCard>
            <GlassCard className="flex-1">
              <Text className="text-onyx-500 text-xs">Dépenses B</Text>
              <Text className="text-white text-lg font-bold" style={{ color: '#EF4444' }}>
                {formatCurrency(stats.expensesB)}
              </Text>
            </GlassCard>
          </View>
          <View className="flex-row mb-6" style={{ gap: 12 }}>
            <GlassCard className="flex-1">
              <Text className="text-onyx-500 text-xs">Solde A</Text>
              <Text
                className="text-lg font-bold"
                style={{ color: stats.balanceA >= 0 ? '#10B981' : '#EF4444' }}
              >
                {stats.balanceA >= 0 ? '+' : ''}{formatCurrency(stats.balanceA)}
              </Text>
            </GlassCard>
            <GlassCard className="flex-1">
              <Text className="text-onyx-500 text-xs">Solde B</Text>
              <Text
                className="text-lg font-bold"
                style={{ color: stats.balanceB >= 0 ? '#10B981' : '#EF4444' }}
              >
                {stats.balanceB >= 0 ? '+' : ''}{formatCurrency(stats.balanceB)}
              </Text>
            </GlassCard>
          </View>

          <Text className="text-white font-semibold mb-3">Évolution (B − A)</Text>
          <GlassCard>
            <View className="flex-row justify-between py-2 border-b border-onyx-200/10">
              <Text className="text-onyx-500">Revenus</Text>
              <Text
                className="font-semibold"
                style={{ color: diffIncome >= 0 ? '#10B981' : '#EF4444' }}
              >
                {diffIncome >= 0 ? '+' : ''}{formatCurrency(diffIncome)}
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-onyx-200/10">
              <Text className="text-onyx-500">Dépenses</Text>
              <Text
                className="font-semibold"
                style={{ color: diffExpenses <= 0 ? '#10B981' : '#EF4444' }}
              >
                {diffExpenses >= 0 ? '+' : ''}{formatCurrency(diffExpenses)}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-onyx-500">Solde</Text>
              <Text
                className="font-semibold"
                style={{ color: diffBalance >= 0 ? '#10B981' : '#EF4444' }}
              >
                {diffBalance >= 0 ? '+' : ''}{formatCurrency(diffBalance)}
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
