import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { BarChart } from 'react-native-gifted-charts';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format,
  isWithinInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTransactionStore, useAccountStore, useConfigStore } from '@/stores';
import { formatCurrency, formatPercentage, formatDate, safeParseISO } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { SpendingTrends } from '@/components/dashboard/SpendingTrends';
import type { Transaction } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
type CategoryModalType = 'expense' | 'income';

export default function StatsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [modalCategory, setModalCategory] = useState<{ catId: string; label: string; type: CategoryModalType } | null>(null);
  const transactions = useTransactionStore((state) => state.transactions);
  const accounts = useAccountStore((state) => state.accounts);
  const getCategoryById = useConfigStore((state) => state.getCategoryById);

  const range = useMemo(() => ({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) }), [selectedMonth]);
  const filteredTx = useMemo(
    () => transactions.filter((tx) => {
      const d = safeParseISO(tx.date);
      return d != null && isWithinInterval(d, { start: range.start, end: range.end });
    }),
    [transactions, range]
  );

  const income = useMemo(() => filteredTx.filter((t) => t.type !== 'transfer' && t.type === 'income').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const expenses = useMemo(() => filteredTx.filter((t) => t.type !== 'transfer' && t.type === 'expense').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const balance = income - expenses;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx.filter((t) => t.type !== 'transfer' && t.type === 'expense').forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([catId, amount]) => ({ catId, amount })).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [filteredTx]);

  const byCategoryIncome = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx.filter((t) => t.type !== 'transfer' && t.type === 'income').forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([catId, amount]) => ({ catId, amount })).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [filteredTx]);

  const modalTransactions = useMemo(() => {
    if (!modalCategory) return [];
    return filteredTx.filter((t) => t.category === modalCategory.catId && t.type === modalCategory.type).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTx, modalCategory]);

  const chartData = useMemo(() => byCategory.map(({ catId, amount }) => {
    const cat = getCategoryById(catId);
    return {
      value: amount,
      label: cat?.label?.slice(0, 6) || catId.slice(0, 6),
      frontColor: cat?.color || colors.accent.primary,
      topLabelComponent: () => <Text style={{ color: colors.text.secondary, fontSize: 10 }}>{formatCurrency(amount)}</Text>,
    };
  }), [byCategory, getCategoryById, colors.accent.primary, colors.text.secondary]);

  const monthOptions = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, 11);
    return eachMonthOfInterval({ start, end }).reverse();
  }, []);

  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  const yearTx = useMemo(() => transactions.filter((tx) => {
    const d = safeParseISO(tx.date);
    return d != null && isWithinInterval(d, { start: yearStart, end: yearEnd });
  }), [transactions, yearStart, yearEnd]);
  const yearIncome = useMemo(() => yearTx.filter((t) => t.type !== 'transfer' && t.type === 'income').reduce((s, t) => s + t.amount, 0), [yearTx]);
  const yearExpenses = useMemo(() => yearTx.filter((t) => t.type !== 'transfer' && t.type === 'expense').reduce((s, t) => s + t.amount, 0), [yearTx]);
  const yearSavingsRate = yearIncome > 0 ? ((yearIncome - yearExpenses) / yearIncome) * 100 : 0;
  const byMonth = useMemo(() => {
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    return months.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const txInMonth = yearTx.filter((tx) => {
        const d = safeParseISO(tx.date);
        return d != null && isWithinInterval(d, { start: monthStart, end: monthEnd });
      });
      const inc = txInMonth.filter((t) => t.type !== 'transfer' && t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txInMonth.filter((t) => t.type !== 'transfer' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { monthStart, income: inc, expenses: exp, savings: inc - exp };
    });
  }, [yearTx, yearStart, yearEnd]);
  const bestMonth = byMonth.length ? byMonth.reduce((best, m) => (m.savings > best.savings ? m : best), byMonth[0]) : null;
  const worstMonth = byMonth.length ? byMonth.reduce((worst, m) => (m.expenses > worst.expenses ? m : worst), byMonth[0]) : null;
  const yearChartData = useMemo(() => byMonth.map((m) => ({
    value: m.savings,
    label: format(m.monthStart, 'MMM', { locale: fr }).slice(0, 3),
    frontColor: m.savings >= 0 ? colors.accent.success : colors.accent.danger,
    topLabelComponent: () => <Text style={{ color: colors.text.secondary, fontSize: 9 }}>{formatCurrency(m.savings)}</Text>,
  })), [byMonth, colors.accent.danger, colors.accent.success, colors.text.secondary]);

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 pt-4 pb-2">
          <Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700' }}>Statistiques</Text>
          <Text style={{ color: colors.text.secondary, marginTop: 4 }}>Revenus, dépenses et répartition par catégorie</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 mb-4">
            <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}>
              <TouchableOpacity onPress={() => setViewMode('month')} className="flex-1 py-2.5 rounded-xl" style={{ backgroundColor: viewMode === 'month' ? colors.accent.primary : 'transparent' }}>
                <Text className="text-center font-semibold text-sm" style={{ color: viewMode === 'month' ? '#fff' : colors.text.secondary }}>Mois</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('year')} className="flex-1 py-2.5 rounded-xl" style={{ backgroundColor: viewMode === 'year' ? colors.accent.primary : 'transparent' }}>
                <Text className="text-center font-semibold text-sm" style={{ color: viewMode === 'year' ? '#fff' : colors.text.secondary }}>Année</Text>
              </TouchableOpacity>
            </View>
          </View>

          {viewMode === 'year' ? (
            <>
              <View className="px-6 mb-4">
                <Text className="font-semibold mb-3" style={{ color: colors.text.primary }}>Année {currentYear}</Text>
                <View className="flex-row" style={{ gap: 12 }}>
                  <GlassCard className="flex-1">
                    <Icons.TrendingUp size={18} color={colors.accent.success} />
                    <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Revenus</Text>
                    <Text className="font-bold" style={{ color: colors.accent.success }}>{formatCurrency(yearIncome)}</Text>
                  </GlassCard>
                  <GlassCard className="flex-1">
                    <Icons.TrendingDown size={18} color={colors.accent.danger} />
                    <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Dépenses</Text>
                    <Text className="font-bold" style={{ color: colors.accent.danger }}>{formatCurrency(yearExpenses)}</Text>
                  </GlassCard>
                </View>
                <View className="mt-3">
                  <Text className="text-xs" style={{ color: colors.text.secondary }}>Taux d'épargne</Text>
                  <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>{formatPercentage(yearSavingsRate)}</Text>
                </View>
                {bestMonth ? <Text className="text-xs mt-2" style={{ color: colors.text.secondary }}>Meilleur mois : <Text style={{ color: colors.accent.success }}>{format(bestMonth.monthStart, 'MMMM yyyy', { locale: fr })}</Text></Text> : null}
                {worstMonth ? <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Pire mois : <Text style={{ color: colors.accent.danger }}>{format(worstMonth.monthStart, 'MMMM yyyy', { locale: fr })}</Text></Text> : null}
              </View>
              {yearChartData.length > 0 ? <View className="px-6 mb-6"><GlassCard><BarChart data={yearChartData} barWidth={Math.min(24, (width - 80) / 12 - 4)} spacing={4} roundedTop roundedBottom hideRules xAxisColor="transparent" yAxisColor={colors.background.tertiary} yAxisTextStyle={{ color: colors.text.tertiary, fontSize: 9 }} noOfSections={4} maxValue={Math.max(...yearChartData.map((d) => Math.abs(d.value)), 1) * 1.2} showVerticalLines={false} initialSpacing={4} endSpacing={4} /></GlassCard></View> : null}
            </>
          ) : (
            <>
              <View className="px-6 mb-4">
                <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Période</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {monthOptions.map((d) => {
                      const isSelected = d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
                      return (
                        <TouchableOpacity key={d.toISOString()} onPress={() => setSelectedMonth(d)} className="px-4 py-2 rounded-xl" style={{ backgroundColor: isSelected ? `${colors.accent.primary}25` : colors.background.secondary, borderWidth: 1, borderColor: isSelected ? colors.accent.primary : colors.background.tertiary }}>
                          <Text className="font-medium" style={{ color: isSelected ? colors.text.primary : colors.text.secondary }}>{format(d, 'MMM yyyy', { locale: fr })}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View className="px-6"><SpendingTrends /></View>

              <View className="px-6 mb-6">
                <View className="flex-row" style={{ gap: 12 }}>
                  <GlassCard className="flex-1"><Icons.TrendingUp size={20} color={colors.accent.success} /><Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Revenus</Text><Text className="text-lg font-bold" style={{ color: colors.accent.success }}>{formatCurrency(income)}</Text></GlassCard>
                  <GlassCard className="flex-1"><Icons.TrendingDown size={20} color={colors.accent.danger} /><Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Dépenses</Text><Text className="text-lg font-bold" style={{ color: colors.accent.danger }}>{formatCurrency(expenses)}</Text></GlassCard>
                  <GlassCard className="flex-1"><Icons.Wallet size={20} color={colors.accent.primary} /><Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Solde</Text><Text className="text-lg font-bold" style={{ color: balance >= 0 ? colors.accent.success : colors.accent.danger }}>{balance >= 0 ? '+' : ''}{formatCurrency(balance)}</Text></GlassCard>
                </View>
              </View>

              {chartData.length > 0 ? <View className="px-6 mb-6"><Text className="font-semibold mb-3" style={{ color: colors.text.primary }}>Dépenses par catégorie</Text><GlassCard><BarChart data={chartData} barWidth={Math.min(32, (width - 80) / chartData.length - 8)} spacing={8} roundedTop roundedBottom hideRules xAxisColor="transparent" yAxisColor={colors.background.tertiary} yAxisTextStyle={{ color: colors.text.tertiary, fontSize: 10 }} noOfSections={4} maxValue={Math.max(...chartData.map((d) => d.value)) * 1.2} showVerticalLines={false} initialSpacing={8} endSpacing={8} /></GlassCard></View> : null}

              <View className="px-6 mb-6">
                <Text className="font-semibold mb-3" style={{ color: colors.text.primary }}>Détail des dépenses par catégorie</Text>
                <Text className="text-xs mb-3" style={{ color: colors.text.secondary }}>Appuyez sur une catégorie pour voir les transactions</Text>
                {byCategory.map(({ catId, amount }) => {
                  const cat = getCategoryById(catId);
                  const pct = expenses > 0 ? (amount / expenses) * 100 : 0;
                  const Icon = cat ? (Icons as any)[cat.icon] : Icons.CircleDot;
                  return (
                    <TouchableOpacity key={catId} activeOpacity={0.7} onPress={() => setModalCategory({ catId, label: cat?.label || catId, type: 'expense' })} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${cat?.color || colors.accent.primary}20` }}>
                        <Icon size={20} color={cat?.color || colors.accent.primary} />
                      </View>
                      <View className="flex-1"><Text style={{ color: colors.text.primary, fontWeight: '600' }}>{cat?.label || catId}</Text><Text className="text-xs" style={{ color: colors.text.secondary }}>{formatPercentage(pct)}</Text></View>
                      <Text style={{ color: colors.text.primary, fontWeight: '600' }}>{formatCurrency(amount)}</Text>
                      <Icons.ChevronRight size={18} color={colors.text.tertiary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  );
                })}
                {byCategory.length === 0 ? <Text className="py-6 text-center" style={{ color: colors.text.secondary }}>Aucune dépense sur cette période</Text> : null}
              </View>

              <View className="px-6 mb-8">
                <Text className="font-semibold mb-3" style={{ color: colors.text.primary }}>Revenus par catégorie</Text>
                <Text className="text-xs mb-3" style={{ color: colors.text.secondary }}>Appuyez sur une catégorie pour voir les transactions</Text>
                {byCategoryIncome.map(({ catId, amount }) => {
                  const cat = getCategoryById(catId);
                  const pct = income > 0 ? (amount / income) * 100 : 0;
                  const Icon = cat ? (Icons as any)[cat.icon] : Icons.CircleDot;
                  return (
                    <TouchableOpacity key={catId} activeOpacity={0.7} onPress={() => setModalCategory({ catId, label: cat?.label || catId, type: 'income' })} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${cat?.color || colors.accent.primary}20` }}>
                        <Icon size={20} color={cat?.color || colors.accent.primary} />
                      </View>
                      <View className="flex-1"><Text style={{ color: colors.text.primary, fontWeight: '600' }}>{cat?.label || catId}</Text><Text className="text-xs" style={{ color: colors.text.secondary }}>{formatPercentage(pct)}</Text></View>
                      <Text style={{ color: colors.accent.success, fontWeight: '600' }}>+{formatCurrency(amount)}</Text>
                      <Icons.ChevronRight size={18} color={colors.text.tertiary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  );
                })}
                {byCategoryIncome.length === 0 ? <Text className="py-6 text-center" style={{ color: colors.text.secondary }}>Aucun revenu sur cette période</Text> : null}
              </View>
            </>
          )}
        </ScrollView>

        <Modal visible={!!modalCategory} animationType="slide" transparent onRequestClose={() => setModalCategory(null)}>
          <View className="flex-1 justify-end">
            <TouchableOpacity className="flex-1 bg-black/60" activeOpacity={1} onPress={() => setModalCategory(null)} />
            <View className="rounded-t-3xl max-h-[80%]" style={{ backgroundColor: colors.background.secondary }}>
              <View className="flex-row items-center justify-between px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }} numberOfLines={1}>{modalCategory?.label}</Text>
                <TouchableOpacity onPress={() => setModalCategory(null)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.background.tertiary }}>
                  <Icons.X size={22} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={modalTransactions}
                keyExtractor={(item) => item.id}
                className="flex-1"
                ListEmptyComponent={<Text className="text-center py-8" style={{ color: colors.text.secondary }}>Aucune transaction</Text>}
                renderItem={({ item }: { item: Transaction }) => {
                  const isIncome = item.type === 'income';
                  return (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => { setModalCategory(null); router.push(`/transaction/${item.id}`); }} className="flex-row items-center px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                      <View className="flex-1">
                        <Text numberOfLines={1} style={{ color: colors.text.primary, fontWeight: '600' }}>{item.description || 'Sans description'}</Text>
                        <Text className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>{formatDate(item.date)}</Text>
                      </View>
                      <Text className="font-semibold text-base" style={{ color: isIncome ? colors.accent.success : colors.accent.danger }}>{isIncome ? '+' : '−'}{formatCurrency(item.amount)}</Text>
                      <Icons.ChevronRight size={18} color={colors.text.tertiary} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
