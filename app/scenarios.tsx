// ============================================
// ONYX - Scénarios « et si »
// Projection de solde avec hypothèses
// ============================================

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, useTransactionStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function ScenariosScreen() {
  const router = useRouter();
  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);

  const [extraIncome, setExtraIncome] = useState('');
  const [extraExpense, setExtraExpense] = useState('');
  const [monthlyRepeat, setMonthlyRepeat] = useState(false);

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + (a.balance ?? 0), 0),
    [accounts]
  );

  const avgMonthlyIncome = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const tx = transactions.filter(
      (t) => t.type === 'income' && new Date(t.date) >= start
    );
    const sum = tx.reduce((s, t) => s + t.amount, 0);
    return tx.length ? sum / 3 : 0;
  }, [transactions]);

  const avgMonthlyExpense = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const tx = transactions.filter(
      (t) => t.type === 'expense' && new Date(t.date) >= start
    );
    const sum = tx.reduce((s, t) => s + t.amount, 0);
    return tx.length ? sum / 3 : 0;
  }, [transactions]);

  const extraInc = parseFloat(extraIncome) || 0;
  const extraExp = parseFloat(extraExpense) || 0;
  const projectedBalance = totalBalance + extraInc - extraExp;
  const projectedMonthly = avgMonthlyIncome - avgMonthlyExpense + (monthlyRepeat ? extraInc - extraExp : 0);

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-6 py-4 border-b border-onyx-200/10">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.ArrowLeft size={24} color="#71717A" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Scénarios</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
          <GlassCard className="mb-6">
            <Text className="text-onyx-500 text-sm">Solde actuel (tous comptes)</Text>
            <Text
              className="text-2xl font-bold mt-1"
              style={{ color: totalBalance >= 0 ? '#10B981' : '#EF4444' }}
            >
              {formatCurrency(totalBalance)}
            </Text>
          </GlassCard>

          <Text className="text-white font-semibold mb-3">Hypothèses</Text>
          <GlassCard className="mb-4">
            <Text className="text-onyx-500 text-sm mb-2">Revenu supplémentaire (€)</Text>
            <TextInput
              value={extraIncome}
              onChangeText={setExtraIncome}
              placeholder="0"
              placeholderTextColor="#52525B"
              keyboardType="decimal-pad"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-lg"
            />
          </GlassCard>
          <GlassCard className="mb-4">
            <Text className="text-onyx-500 text-sm mb-2">Dépense supplémentaire (€)</Text>
            <TextInput
              value={extraExpense}
              onChangeText={setExtraExpense}
              placeholder="0"
              placeholderTextColor="#52525B"
              keyboardType="decimal-pad"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-lg"
            />
          </GlassCard>
          <TouchableOpacity
            onPress={() => setMonthlyRepeat(!monthlyRepeat)}
            className="flex-row items-center mb-6"
          >
            <View
              className="w-5 h-5 rounded border-2 mr-2 items-center justify-center"
              style={{ borderColor: monthlyRepeat ? '#6366F1' : '#52525B' }}
            >
              {monthlyRepeat && <View className="w-3 h-3 rounded-full bg-accent-primary" />}
            </View>
            <Text className="text-white">Appliquer ces montants chaque mois (tendance)</Text>
          </TouchableOpacity>

          <Text className="text-white font-semibold mb-3">Résultat du scénario</Text>
          <GlassCard className="mb-4">
            <Text className="text-onyx-500 text-sm">Solde projeté (une fois)</Text>
            <Text
              className="text-xl font-bold mt-1"
              style={{ color: projectedBalance >= 0 ? '#10B981' : '#EF4444' }}
            >
              {formatCurrency(projectedBalance)}
            </Text>
          </GlassCard>
          {monthlyRepeat && (
            <GlassCard>
              <Text className="text-onyx-500 text-sm">Épargne mensuelle projetée</Text>
              <Text
                className="text-xl font-bold mt-1"
                style={{ color: projectedMonthly >= 0 ? '#10B981' : '#EF4444' }}
              >
                {formatCurrency(projectedMonthly)} / mois
              </Text>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
