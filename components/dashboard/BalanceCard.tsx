// ============================================
// ONYX - Balance Card Component
// Carte affichant le patrimoine total améliorée
// ============================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAccountStore, useTransactionStore, useBudgetStore } from '@/stores';
import { formatCurrency, formatPercentage, formatCompactCurrency } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';

export function BalanceCard() {
  const [isHidden, setIsHidden] = useState(false);
  
  const totalBalance = useAccountStore((state) => state.getTotalBalance());
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  const transactions = useTransactionStore((state) => state.transactions);
  const budgetsAtRisk = useBudgetStore((state) => 
    state.getAllBudgetsProgress().filter(b => b.percentage >= 80)
  );
  
  // Calculer les stats du mois
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const thisMonthTx = transactions.filter((t) => {
    const txDate = parseISO(t.date);
    return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
  });
  
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
    const txDate = parseISO(t.date);
    return isWithinInterval(txDate, { start: lastMonthStart, end: lastMonthEnd });
  });
  
  const lastMonthExpense = lastMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenseTrend = lastMonthExpense > 0 
    ? ((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100 
    : 0;
  
  const isPositive = monthlyChange >= 0;

  // Animation pour le montant
  const scale = useSharedValue(1);
  
  const handleToggleVisibility = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1)
    );
    setIsHidden(!isHidden);
  };

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
              {isHidden ? '••••••' : formatCurrency(totalBalance)}
            </Text>
          </Animated.View>
        </View>
        
        <TouchableOpacity
          onPress={handleToggleVisibility}
          className="p-2 rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          {isHidden ? (
            <EyeOff size={20} color="#71717A" />
          ) : (
            <Eye size={20} color="#71717A" />
          )}
        </TouchableOpacity>
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
            {isHidden ? '••••' : `+${formatCompactCurrency(monthlyIncome)}`}
          </Text>
        </View>
        
        {/* Dépenses */}
        <View className="flex-1 items-center border-r border-onyx-200/10">
          <View className="flex-row items-center mb-1">
            <TrendingDown size={12} color="#EF4444" />
            <Text className="text-onyx-500 text-xs ml-1">Dépenses</Text>
          </View>
          <Text className="text-accent-danger font-semibold">
            {isHidden ? '••••' : `-${formatCompactCurrency(monthlyExpense)}`}
          </Text>
        </View>
        
        {/* Solde */}
        <View className="flex-1 items-center">
          <Text className="text-onyx-500 text-xs mb-1">Solde</Text>
          <Text 
            className="font-semibold"
            style={{ color: isPositive ? '#10B981' : '#EF4444' }}
          >
            {isHidden ? '••••' : `${isPositive ? '+' : ''}${formatCompactCurrency(monthlyChange)}`}
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
              {isHidden ? '••' : `${expenseTrend > 0 ? '+' : ''}${formatPercentage(expenseTrend)}`}
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
