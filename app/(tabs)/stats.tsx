// ============================================
// ONYX - Statistiques
// Graphiques et analyses, catégories cliquables
// ============================================

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
  subMonths,
  format,
  parseISO,
  isWithinInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTransactionStore, useAccountStore } from '@/stores';
import { formatCurrency, formatPercentage, formatDate } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { CATEGORIES } from '@/types';
import type { Transaction } from '@/types';

const { width } = Dimensions.get('window');

type CategoryModalType = 'expense' | 'income';

export default function StatsScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [modalCategory, setModalCategory] = useState<{
    catId: string;
    label: string;
    type: CategoryModalType;
  } | null>(null);
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

  const byCategoryIncome = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([catId, amount]) => ({ catId, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [filteredTx]);

  const modalTransactions = useMemo(() => {
    if (!modalCategory) return [];
    return filteredTx
      .filter((t) => t.category === modalCategory.catId && t.type === modalCategory.type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTx, modalCategory]);

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

          {/* Liste catégories dépenses */}
          <View className="px-6 mb-6">
            <Text className="text-white font-semibold mb-3">Détail des dépenses par catégorie</Text>
            <Text className="text-onyx-500 text-xs mb-3">Appuyez sur une catégorie pour voir les transactions</Text>
            {byCategory.map(({ catId, amount }) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              const pct = expenses > 0 ? (amount / expenses) * 100 : 0;
              const Icon = cat ? (Icons as any)[cat.icon] : Icons.CircleDot;
              return (
                <TouchableOpacity
                  key={catId}
                  activeOpacity={0.7}
                  onPress={() => setModalCategory({ catId, label: cat?.label || catId, type: 'expense' })}
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
                  <Icons.ChevronRight size={18} color="#71717A" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })}
            {byCategory.length === 0 && (
              <Text className="text-onyx-500 py-6 text-center">Aucune dépense sur cette période</Text>
            )}
          </View>

          {/* Liste catégories revenus */}
          <View className="px-6 mb-8">
            <Text className="text-white font-semibold mb-3">Revenus par catégorie</Text>
            <Text className="text-onyx-500 text-xs mb-3">Appuyez sur une catégorie pour voir les transactions</Text>
            {byCategoryIncome.map(({ catId, amount }) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              const pct = income > 0 ? (amount / income) * 100 : 0;
              const Icon = cat ? (Icons as any)[cat.icon] : Icons.CircleDot;
              return (
                <TouchableOpacity
                  key={catId}
                  activeOpacity={0.7}
                  onPress={() => setModalCategory({ catId, label: cat?.label || catId, type: 'income' })}
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
                  <Text className="text-white font-semibold" style={{ color: '#10B981' }}>
                    +{formatCurrency(amount)}
                  </Text>
                  <Icons.ChevronRight size={18} color="#71717A" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })}
            {byCategoryIncome.length === 0 && (
              <Text className="text-onyx-500 py-6 text-center">Aucun revenu sur cette période</Text>
            )}
          </View>
        </ScrollView>

        {/* Modal liste des transactions de la catégorie */}
        <Modal
          visible={!!modalCategory}
          animationType="slide"
          transparent
          onRequestClose={() => setModalCategory(null)}
        >
          <View className="flex-1 justify-end">
            <TouchableOpacity
              className="flex-1 bg-black/60"
              activeOpacity={1}
              onPress={() => setModalCategory(null)}
            />
            <View
              className="bg-onyx-100 rounded-t-3xl max-h-[80%]"
              style={{ backgroundColor: '#18181B' }}
            >
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-onyx-200/20">
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {modalCategory?.label}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalCategory(null)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Icons.X size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={modalTransactions}
                keyExtractor={(item) => item.id}
                className="flex-1"
                ListEmptyComponent={
                  <Text className="text-onyx-500 text-center py-8">Aucune transaction</Text>
                }
                renderItem={({ item }: { item: Transaction }) => {
                  const isIncome = item.type === 'income';
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setModalCategory(null);
                        router.push(`/transaction/${item.id}`);
                      }}
                      className="flex-row items-center px-6 py-4 border-b border-onyx-200/10"
                    >
                      <View className="flex-1">
                        <Text className="text-white font-medium" numberOfLines={1}>
                          {item.description || 'Sans description'}
                        </Text>
                        <Text className="text-onyx-500 text-xs mt-0.5">{formatDate(item.date)}</Text>
                      </View>
                      <Text
                        className="font-semibold text-base"
                        style={{ color: isIncome ? '#10B981' : '#EF4444' }}
                      >
                        {isIncome ? '+' : '−'}{formatCurrency(item.amount)}
                      </Text>
                      <Icons.ChevronRight size={18} color="#71717A" style={{ marginLeft: 8 }} />
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
