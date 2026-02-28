// ============================================
// ONYX - Balance Card Component
// Carte affichant le patrimoine total améliorée
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
} from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  useAnimatedReaction,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useAccountStore, useTransactionStore, useBudgetStore, useSettingsStore } from '@/stores';
import { formatCurrency, formatPercentage, formatCompactCurrency, displayAmount, safeParseISO } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

export function BalanceCard() {
  const totalBalance = useAccountStore((state) => state.getTotalBalance());
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const transactions = useTransactionStore((state) => state.transactions);
  const budgetsAtRisk = useBudgetStore((state) => 
    state.getAllBudgetsProgress().filter(b => b.percentage >= 80)
  );
  const privacyMode = useSettingsStore((state) => state.privacyMode ?? false);
  const currency = useSettingsStore((state) => state.currency);
  const locale = useSettingsStore((state) => state.locale);
  
  // Calculer les stats du mois
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const thisMonthTx = transactions.filter((t) => {
    const txDate = safeParseISO(t.date);
    return txDate != null && isWithinInterval(txDate, { start: monthStart, end: monthEnd });
  }).filter((t) => t.type !== 'transfer');
  
  const monthlyIncome = thisMonthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpense = thisMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyChange = monthlyIncome - monthlyExpense;
  
  // Calculer la variation par rapport au mois dernier
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  
  const lastMonthTx = transactions.filter((t) => {
    const txDate = safeParseISO(t.date);
    return txDate != null && isWithinInterval(txDate, { start: lastMonthStart, end: lastMonthEnd });
  }).filter((t) => t.type !== 'transfer');
  
  const lastMonthExpense = lastMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenseTrend = lastMonthExpense > 0 
    ? ((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100 
    : 0;
  
  const isPositive = monthlyChange >= 0;

  // Compteur animé du solde total au chargement (0 → totalBalance en 800ms)
  const animatedBalance = useSharedValue(0);
  const [displayBalance, setDisplayBalance] = useState(() => formatCurrency(0));
  
  useEffect(() => {
    if (totalBalance === 0) {
      setDisplayBalance(displayAmount(0, privacyMode, currency, locale));
      return;
    }
    animatedBalance.value = 0;
    setDisplayBalance(displayAmount(0, privacyMode, currency, locale));
    animatedBalance.value = withTiming(totalBalance, {
      duration: 800,
      easing: Easing.bezier(0, 0, 0.2, 1),
    });
  }, [totalBalance, privacyMode, currency, locale]);
  
  useAnimatedReaction(
    () => animatedBalance.value,
    (v) => {
      runOnJS(setDisplayBalance)(displayAmount(Math.round(v), privacyMode, currency, locale));
    },
    [totalBalance, privacyMode, currency, locale]
  );

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GlassCard variant="light" className="mb-6">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-onyx-500 text-sm">Patrimoine Total</Text>
            {budgetsAtRisk.length > 0 && (
              <View 
                className="ml-2 px-2 py-0.5 rounded-full flex-row items-center"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
              >
                <Sparkles size={10} color="#F59E0B" />
                <Text className="text-amber-500 text-xs ml-1">
                  {budgetsAtRisk.length} alerte{budgetsAtRisk.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          
          <Animated.View style={animatedStyle}>
            <Text 
              className="text-white text-4xl font-bold mt-1"
              style={{ color: totalBalance >= 0 ? '#fff' : '#EF4444' }}
            >
              {displayBalance}
            </Text>
          </Animated.View>
          {/* Indicateur de tendance vs il y a 30 jours */}
          {!privacyMode && (() => {
            const balance30DaysAgo = totalBalance - monthlyChange;
            const ref = Math.abs(balance30DaysAgo) || 1;
            const pct = (monthlyChange / ref) * 100;
            if (pct >= -1 && pct <= 1) {
              return (
                <Text className="text-onyx-500 text-sm mt-1">= Stable ce mois-ci</Text>
              );
            }
            if (monthlyChange > 0) {
              return (
                <Text className="text-accent-success text-sm mt-1">
                  ↑ +{formatCurrency(monthlyChange)} ce mois-ci
                </Text>
              );
            }
            return (
              <Text className="text-accent-danger text-sm mt-1">
                ↓ {formatCurrency(monthlyChange)} ce mois-ci
              </Text>
            );
          })()}
        </View>
        
        {/* Toggle mode discret : géré par le header du dashboard */}
      </View>
      
      {/* Nombre de comptes */}
      <Text className="text-onyx-500 text-sm mb-4">
        {accounts.length} compte{accounts.length > 1 ? 's' : ''} actif{accounts.length > 1 ? 's' : ''}
      </Text>
      
      {/* Stats du mois */}
        <View 
        className="flex-row rounded-2xl p-3 mb-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        {/* Revenus */}
        <View className="flex-1 items-center border-r border-onyx-200/10">
          <View className="flex-row items-center mb-1">
            <TrendingUp size={12} color="#10B981" />
            <Text className="text-onyx-500 text-xs ml-1">Revenus</Text>
          </View>
          <Text className="text-accent-success font-semibold">
            {privacyMode ? '••••' : `+${formatCompactCurrency(monthlyIncome)}`}
          </Text>
        </View>
        
        {/* Dépenses */}
        <View className="flex-1 items-center border-r border-onyx-200/10">
          <View className="flex-row items-center mb-1">
            <TrendingDown size={12} color="#EF4444" />
            <Text className="text-onyx-500 text-xs ml-1">Dépenses</Text>
          </View>
          <Text className="text-accent-danger font-semibold">
            {privacyMode ? '••••' : `-${formatCompactCurrency(monthlyExpense)}`}
          </Text>
        </View>
        
        {/* Solde */}
        <View className="flex-1 items-center">
          <Text className="text-onyx-500 text-xs mb-1">Solde</Text>
          <Text 
            className="font-semibold"
            style={{ color: isPositive ? '#10B981' : '#EF4444' }}
          >
            {privacyMode ? '••••' : `${isPositive ? '+' : ''}${formatCompactCurrency(monthlyChange)}`}
          </Text>
        </View>
      </View>
      
      {/* Tendance */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View 
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ 
              backgroundColor: expenseTrend <= 0 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)' 
            }}
          >
            {expenseTrend <= 0 ? (
              <TrendingDown size={14} color="#10B981" />
            ) : (
              <TrendingUp size={14} color="#EF4444" />
            )}
            <Text 
              className="ml-1 font-semibold text-sm"
              style={{ color: expenseTrend <= 0 ? '#10B981' : '#EF4444' }}
            >
              {privacyMode ? '••' : `${expenseTrend > 0 ? '+' : ''}${formatPercentage(expenseTrend)}`}
            </Text>
          </View>
          <Text className="text-onyx-500 text-sm ml-2">vs mois dernier</Text>
        </View>
        
        {/* Indicateur de santé financière */}
        <View className="flex-row items-center">
          {isPositive && monthlyChange > monthlyExpense * 0.2 ? (
            <Text className="text-accent-success text-sm">🎯 Excellente forme</Text>
          ) : isPositive ? (
            <Text className="text-accent-primary text-sm">👍 Équilibré</Text>
          ) : (
            <Text className="text-accent-warning text-sm">⚠️ Vigilance</Text>
          )}
        </View>
      </View>
    </GlassCard>
  );
}
