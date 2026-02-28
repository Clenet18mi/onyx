// ============================================
// ONYX - Monthly Recap Modal
// Bilan de fin de mois (mois précédent)
// ============================================

import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTransactionStore, useSettingsStore, useConfigStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

interface MonthlyRecapModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MonthlyRecapModal({ visible, onClose }: MonthlyRecapModalProps) {
  const router = useRouter();
  const lastBilanMonth = useSettingsStore((s) => s.lastBilanMonth);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const getTransactionsByDateRange = useTransactionStore((s) => s.getTransactionsByDateRange);
  const getCategoryById = useConfigStore((s) => s.getCategoryById);

  const previousMonth = useMemo(() => subMonths(new Date(), 1), []);
  const monthKey = format(previousMonth, 'yyyy-MM');
  const startPrev = startOfMonth(previousMonth);
  const endPrev = endOfMonth(previousMonth);
  const startPrevPrev = startOfMonth(subMonths(previousMonth, 1));
  const endPrevPrev = endOfMonth(subMonths(previousMonth, 1));

  const data = useMemo(() => {
    const txsPrev = getTransactionsByDateRange(startPrev.toISOString(), endPrev.toISOString())
      .filter((t) => t.type !== 'transfer');
    const txsPrevPrev = getTransactionsByDateRange(startPrevPrev.toISOString(), endPrevPrev.toISOString())
      .filter((t) => t.type !== 'transfer');

    const incomePrev = txsPrev
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expensePrev = txsPrev
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const incomePrevPrev = txsPrevPrev
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expensePrevPrev = txsPrevPrev
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const savingsRatePrev = incomePrev > 0 ? ((incomePrev - expensePrev) / incomePrev) * 100 : 0;

    const byCategory: Record<string, number> = {};
    txsPrev
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      });
    const topEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topCategoryId = topEntry?.[0];
    const topCategoryAmount = topEntry?.[1] ?? 0;
    const topCategoryLabel = topCategoryId ? getCategoryById(topCategoryId)?.label ?? topCategoryId : '—';
    const topCategoryIcon = topCategoryId ? getCategoryById(topCategoryId)?.icon : null;

    const expenseDiffPct = expensePrevPrev > 0 ? ((expensePrev - expensePrevPrev) / expensePrevPrev) * 100 : 0;
    const incomeDiffPct = incomePrevPrev > 0 ? ((incomePrev - incomePrevPrev) / incomePrevPrev) * 100 : 0;

    return {
      monthLabel: format(previousMonth, 'MMMM yyyy', { locale: fr }),
      income: incomePrev,
      expense: expensePrev,
      savingsRate: savingsRatePrev,
      topCategoryLabel,
      topCategoryAmount,
      topCategoryIcon,
      expenseDiffPct,
      incomeDiffPct,
    };
  }, [getTransactionsByDateRange, getCategoryById, startPrev, endPrev, startPrevPrev, endPrevPrev, previousMonth]);

  const handleClose = () => {
    updateSettings({ lastBilanMonth: monthKey });
    onClose();
  };

  const handleViewStats = () => {
    updateSettings({ lastBilanMonth: monthKey });
    onClose();
    router.push('/(tabs)/stats');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <GlassCard variant="light" className="w-full">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Bilan de {data.monthLabel}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icons.X size={24} color="#71717A" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-onyx-500">💰 Revenus</Text>
              <Text className="text-accent-success font-semibold">+{formatCurrency(data.income)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-onyx-500">💸 Dépenses</Text>
              <Text className="text-accent-danger font-semibold">-{formatCurrency(data.expense)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-onyx-500">📊 Taux d'épargne</Text>
              <Text className="text-white font-semibold">{data.savingsRate.toFixed(1)} %</Text>
            </View>
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-onyx-500">🏆 Catégorie la plus dépensière</Text>
              <View className="flex-row items-center flex-shrink-0 max-w-[60%]">
                {data.topCategoryIcon && (
                  <View className="mr-1.5">
                    {React.createElement((Icons as any)[data.topCategoryIcon] ?? Icons.CircleDot, { size: 16, color: '#71717A' })}
                  </View>
                )}
                <Text className="text-white font-medium" numberOfLines={1}>{data.topCategoryLabel} — {formatCurrency(data.topCategoryAmount)}</Text>
              </View>
            </View>
            <View className="mt-2 pt-2 border-t border-onyx-200/20">
              <Text className="text-onyx-500 text-xs mb-1">📈 vs mois précédent</Text>
              <Text style={{ color: data.expenseDiffPct > 0 ? '#EF4444' : '#10B981', fontSize: 12 }}>
                {data.expenseDiffPct > 0 ? '+' : ''}{data.expenseDiffPct.toFixed(0)}% de dépenses
              </Text>
              <Text style={{ color: data.incomeDiffPct >= 0 ? '#10B981' : '#EF4444', fontSize: 12 }}>
                {data.incomeDiffPct >= 0 ? '+' : ''}{data.incomeDiffPct.toFixed(0)}% de revenus
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Button title="Fermer" variant="ghost" style={{ flex: 1 }} onPress={handleClose} />
            <Button title="Voir les stats" variant="primary" style={{ flex: 1 }} onPress={handleViewStats} />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}
