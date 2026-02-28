// ============================================
// ONYX - Smart Insights Component
// Résumé intelligent de la situation financière
// ============================================

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useTransactionStore, useAccountStore, useBudgetStore, useSubscriptionStore, useConfigStore } from '@/stores';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  parseISO, 
  isWithinInterval,
  differenceInDays,
  endOfDay,
} from 'date-fns';

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function InsightCard({ icon, title, value, subtitle, color, trend, trendValue }: InsightCardProps) {
  return (
    <View 
      className="flex-1 p-4 rounded-2xl"
      style={{ backgroundColor: `${color}10` }}
    >
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-onyx-500 text-sm ml-2">{title}</Text>
      </View>
      <Text className="text-white text-xl font-bold">{value}</Text>
      {subtitle && (
        <Text className="text-onyx-500 text-xs mt-1">{subtitle}</Text>
      )}
      {trend && trendValue && (
        <View className="flex-row items-center mt-2">
          {trend === 'up' ? (
            <Icons.TrendingUp size={12} color="#10B981" />
          ) : trend === 'down' ? (
            <Icons.TrendingDown size={12} color="#EF4444" />
          ) : (
            <Icons.Minus size={12} color="#71717A" />
          )}
          <Text 
            className="text-xs ml-1"
            style={{ 
              color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#71717A' 
            }}
          >
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}

export function SmartInsights() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);
  const totalBalance = useAccountStore((state) => state.getTotalBalance());
  const budgets = useBudgetStore((state) => state.getAllBudgetsProgress());
  const monthlySubscriptions = useSubscriptionStore((state) => state.getTotalMonthlySubscriptions());
  const getCategoryById = useConfigStore((state) => state.getCategoryById);

  const insights = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    // Transactions ce mois
    const thisMonthTx = transactions.filter((t) => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: thisMonthStart, end: thisMonthEnd });
    });
    
    // Transactions mois dernier
    const lastMonthTx = transactions.filter((t) => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    });
    
    // Revenus/Dépenses ce mois
    const thisMonthIncome = thisMonthTx
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const thisMonthExpense = thisMonthTx
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    
    // Revenus/Dépenses mois dernier
    const lastMonthIncome = lastMonthTx
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const lastMonthExpense = lastMonthTx
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    
    // Tendance des dépenses
    const expenseTrend = lastMonthExpense > 0 
      ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 
      : 0;
    
    // Top catégories de dépenses
    const categoryTotals: { [key: string]: number } = {};
    thisMonthTx
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });
    
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId, amount]) => {
        const cat = getCategoryById(catId);
        return { category: cat, amount };
      });
    
    // Jours restants dans le mois
    const daysRemaining = differenceInDays(thisMonthEnd, now);
    
    // Budget restant estimé (revenus - dépenses - abonnements restants)
    const estimatedRemaining = thisMonthIncome - thisMonthExpense;
    const dailyBudget = daysRemaining > 0 ? estimatedRemaining / daysRemaining : 0;
    
    // Budgets en alerte
    const budgetsAtRisk = budgets.filter(b => b.percentage >= 80);
    
    // Score financier (simple)
    let healthScore = 100;
    if (thisMonthExpense > thisMonthIncome) healthScore -= 30;
    if (budgetsAtRisk.length > 0) healthScore -= budgetsAtRisk.length * 10;
    if (expenseTrend > 20) healthScore -= 15;
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    return {
      thisMonthIncome,
      thisMonthExpense,
      lastMonthExpense,
      expenseTrend,
      topCategories,
      daysRemaining,
      dailyBudget,
      estimatedRemaining,
      budgetsAtRisk,
      healthScore,
      transactionCount: thisMonthTx.length,
    };
  }, [transactions, budgets, getCategoryById]);

  // Déterminer la couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  // Générer un conseil personnalisé
  const getAdvice = () => {
    if (insights.healthScore >= 80) {
      return { icon: '🎯', text: 'Excellent ! Vos finances sont en bonne santé.' };
    }
    if (insights.budgetsAtRisk.length > 0) {
      const budget = insights.budgetsAtRisk[0];
      const cat = getCategoryById(budget.category);
      return { 
        icon: '⚠️', 
        text: `Attention: Budget ${cat?.label || ''} à ${formatPercentage(budget.percentage)}` 
      };
    }
    if (insights.expenseTrend > 20) {
      return { 
        icon: '📊', 
        text: `Dépenses en hausse de ${formatPercentage(insights.expenseTrend)} vs mois dernier` 
      };
    }
    if (insights.dailyBudget < 20) {
      return { icon: '💡', text: 'Budget serré. Surveillez vos dépenses.' };
    }
    return { icon: '✨', text: 'Continuez sur cette lancée !' };
  };

  const advice = getAdvice();

  return (
    <View className="mb-6">
      {/* Conseil du jour */}
      <GlassCard className="mb-4">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">{advice.icon}</Text>
          <Text className="text-white flex-1">{advice.text}</Text>
        </View>
      </GlassCard>

      {/* Stats rapides */}
      <View className="flex-row mb-4" style={{ gap: 12 }}>
        <InsightCard
          icon={<Icons.TrendingUp size={16} color="#10B981" />}
          title="Revenus"
          value={formatCurrency(insights.thisMonthIncome)}
          subtitle="ce mois"
          color="#10B981"
        />
        <InsightCard
          icon={<Icons.TrendingDown size={16} color="#EF4444" />}
          title="Dépenses"
          value={formatCurrency(insights.thisMonthExpense)}
          subtitle="ce mois"
          color="#EF4444"
          trend={insights.expenseTrend > 5 ? 'up' : insights.expenseTrend < -5 ? 'down' : 'neutral'}
          trendValue={`${insights.expenseTrend > 0 ? '+' : ''}${formatPercentage(insights.expenseTrend)}`}
        />
      </View>

      <View className="flex-row mb-4" style={{ gap: 12 }}>
        <InsightCard
          icon={<Icons.Calendar size={16} color="#6366F1" />}
          title="Budget/jour"
          value={formatCurrency(Math.max(insights.dailyBudget, 0))}
          subtitle={`${insights.daysRemaining}j restants`}
          color="#6366F1"
        />
        <InsightCard
          icon={<Icons.CreditCard size={16} color="#8B5CF6" />}
          title="Abonnements"
          value={formatCurrency(monthlySubscriptions)}
          subtitle="par mois"
          color="#8B5CF6"
        />
      </View>

      {/* Top catégories */}
      {insights.topCategories.length > 0 && (
        <GlassCard>
          <Text className="text-white text-base font-semibold mb-3">
            Top dépenses ce mois
          </Text>
          {insights.topCategories.map((item, index) => {
            if (!item.category) return null;
            const Icon = (Icons as any)[item.category.icon] || Icons.CircleDot;
            const percentage = insights.thisMonthExpense > 0 
              ? (item.amount / insights.thisMonthExpense) * 100 
              : 0;
            
            return (
              <View key={index} className="mb-3 last:mb-0">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <View 
                      className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                      style={{ backgroundColor: `${item.category.color}20` }}
                    >
                      <Icon size={16} color={item.category.color} />
                    </View>
                    <Text className="text-white font-medium">{item.category.label}</Text>
                  </View>
                  <Text className="text-white font-semibold">{formatCurrency(item.amount)}</Text>
                </View>
                <View 
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.category.color,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </GlassCard>
      )}
    </View>
  );
}
