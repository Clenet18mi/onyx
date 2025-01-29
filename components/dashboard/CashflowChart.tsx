// ============================================
// ONYX - Cashflow Chart Component
// Graphique des entrées/sorties
// ============================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTransactionStore } from '@/stores';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');

type Period = 'week' | 'month';

export function CashflowChart() {
  const [period, setPeriod] = useState<Period>('week');
  const [selectedBar, setSelectedBar] = useState<any>(null);
  
  const transactions = useTransactionStore((state) => state.transactions);
  
  // Calculer les données du graphique
  const now = new Date();
  
  let chartData: { value: number; frontColor: string; label: string; date: Date }[] = [];
  
  if (period === 'week') {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    
    chartData = days.map((day) => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const dayTransactions = transactions.filter((tx) => {
        const txDate = parseISO(tx.date);
        return isWithinInterval(txDate, { start: dayStart, end: dayEnd });
      });
      
      const income = dayTransactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const expenses = dayTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const net = income - expenses;
      
      return {
        value: Math.abs(net),
        frontColor: net >= 0 ? '#10B981' : '#EF4444',
        label: format(day, 'EEE', { locale: fr }).slice(0, 2),
        date: day,
      };
    });
  } else {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    
    chartData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const weekTransactions = transactions.filter((tx) => {
        const txDate = parseISO(tx.date);
        return isWithinInterval(txDate, { start: weekStart, end: weekEnd });
      });
      
      const income = weekTransactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const expenses = weekTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const net = income - expenses;
      
      return {
        value: Math.abs(net),
        frontColor: net >= 0 ? '#10B981' : '#EF4444',
        label: `S${index + 1}`,
        date: weekStart,
      };
    });
  }

  // Calculer les totaux
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalExpenses = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <GlassCard className="mb-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-semibold">Cashflow</Text>
        
        <View className="flex-row rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <TouchableOpacity
            onPress={() => setPeriod('week')}
            className={`px-4 py-2 ${period === 'week' ? 'bg-accent-primary' : ''}`}
          >
            <Text className={`text-sm font-medium ${period === 'week' ? 'text-white' : 'text-onyx-500'}`}>
              Semaine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPeriod('month')}
            className={`px-4 py-2 ${period === 'month' ? 'bg-accent-primary' : ''}`}
          >
            <Text className={`text-sm font-medium ${period === 'month' ? 'text-white' : 'text-onyx-500'}`}>
              Mois
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chart */}
      <View className="items-center mb-4">
        <BarChart
          data={chartData}
          width={width - 80}
          height={150}
          barWidth={period === 'week' ? 28 : 40}
          spacing={period === 'week' ? 16 : 20}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{ color: '#71717A', fontSize: 10 }}
          xAxisLabelTextStyle={{ color: '#71717A', fontSize: 11 }}
          noOfSections={4}
          maxValue={Math.max(...chartData.map((d) => d.value), 100)}
          isAnimated
          animationDuration={500}
          onPress={(item: any, index: number) => {
            setSelectedBar(selectedBar === index ? null : index);
          }}
        />
      </View>

      {/* Tooltip */}
      {selectedBar !== null && chartData[selectedBar] && (
        <View 
          className="px-4 py-2 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <Text className="text-onyx-500 text-sm">
            {format(chartData[selectedBar].date, 'd MMMM', { locale: fr })}
          </Text>
          <Text 
            className="text-lg font-semibold"
            style={{ color: chartData[selectedBar].frontColor }}
          >
            {chartData[selectedBar].frontColor === '#10B981' ? '+' : '-'}
            {formatCurrency(chartData[selectedBar].value)}
          </Text>
        </View>
      )}

      {/* Summary */}
      <View className="flex-row justify-between">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            <View className="w-3 h-3 rounded-full bg-accent-success mr-2" />
            <Text className="text-onyx-500 text-sm">Entrées</Text>
          </View>
          <Text className="text-white text-lg font-semibold">
            +{formatCurrency(totalIncome)}
          </Text>
        </View>
        
        <View className="flex-1 ml-2">
          <View className="flex-row items-center mb-1">
            <View className="w-3 h-3 rounded-full bg-accent-danger mr-2" />
            <Text className="text-onyx-500 text-sm">Sorties</Text>
          </View>
          <Text className="text-white text-lg font-semibold">
            -{formatCurrency(totalExpenses)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}
