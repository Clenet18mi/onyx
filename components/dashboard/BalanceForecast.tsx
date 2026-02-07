// ============================================
// ONYX - Balance Forecast
// Projection du solde sur 30 jours
// ============================================

import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAccountStore, useTransactionStore, useConfigStore, useSubscriptionStore, usePlannedTransactionStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { addDays, parseISO, differenceInDays, getDate, startOfDay } from 'date-fns';

const { width } = Dimensions.get('window');

export function BalanceForecast() {
  const totalBalance = useAccountStore((s) => s.getTotalBalance());
  const transactions = useTransactionStore((s) => s.transactions);
  const profile = useConfigStore((s) => s.profile);
  const subscriptions = useSubscriptionStore((s) => s.subscriptions).filter((s) => s.isActive);
  const plannedTransactions = usePlannedTransactionStore((s) => s.plannedTransactions);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysElapsed = differenceInDays(now, thisMonthStart) + 1;
  const thisMonthExpenses = transactions
    .filter((t) => {
      const d = parseISO(t.date);
      return d >= thisMonthStart && d <= now && t.type === 'expense';
    })
    .reduce((s, t) => s + t.amount, 0);
  const dailyAvg = daysElapsed > 0 ? thisMonthExpenses / daysElapsed : 0;
  const salaryDay = profile.salaryDay;
  const salaryAmount = profile.defaultSalaryAmount ?? 0;

  // Recompute when balance, transactions or planned change
  const chartData = useMemo(() => {
    const points: { value: number; label: string; dataPointText?: string }[] = [];
    let balance = totalBalance;
    const todayStart = startOfDay(now);
    for (let i = 0; i <= 30; i++) {
      const d = addDays(now, i);
      if (i > 0) {
        balance -= dailyAvg;
        if (salaryDay != null && getDate(d) === salaryDay && salaryAmount > 0) balance += salaryAmount;
        subscriptions.forEach((sub) => {
          const next = parseISO(sub.nextBillingDate);
          if (differenceInDays(next, d) === 0) balance -= sub.amount;
        });
        plannedTransactions
          .filter((pt) => pt.status === 'pending')
          .forEach((pt) => {
            const plannedDay = startOfDay(parseISO(pt.plannedDate));
            const diff = differenceInDays(plannedDay, todayStart);
            if (diff === i) {
              if (pt.type === 'income') balance += pt.amount;
              else balance -= pt.amount;
            }
          });
      }
      points.push({
        value: Math.round(balance * 100) / 100,
        label: i === 0 ? 'Auj.' : i === 30 ? 'J+30' : '',
        dataPointText: i === 0 || i === 30 ? formatCurrency(balance) : undefined,
      });
    }
    return points;
  }, [totalBalance, dailyAvg, salaryDay, salaryAmount, subscriptions, transactions.length, plannedTransactions]);

  const minBalance = Math.min(...chartData.map((p) => p.value));
  const maxBalance = Math.max(...chartData.map((p) => p.value));
  const hasNegative = minBalance < 0;

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">📈</Text>
        <Text className="text-white text-lg font-semibold">Prévision de solde</Text>
      </View>
      <GlassCard>
        <Text className="text-onyx-500 text-sm mb-2">Prochaines 30 jours</Text>
        <View style={{ paddingVertical: 8 }}>
          <LineChart
            data={chartData}
            width={width - 80}
            height={160}
            spacing={(width - 80) / 30}
            initialSpacing={10}
            endSpacing={10}
            color="#6366F1"
            thickness={2}
            startFillColor="rgba(99, 102, 241, 0.3)"
            endFillColor="rgba(99, 102, 241, 0.01)"
            startOpacity={0.9}
            endOpacity={0.2}
            areaChart
            yAxisColor="rgba(255,255,255,0.1)"
            xAxisColor="rgba(255,255,255,0.1)"
            yAxisTextStyle={{ color: '#71717A', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#71717A', fontSize: 10 }}
            noOfSections={4}
            maxValue={maxBalance + 100}
            minValue={hasNegative ? minBalance - 100 : 0}
            hideDataPoints={chartData.length > 15}
            dataPointsColor={hasNegative ? '#EF4444' : '#6366F1'}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <View>
            <Text className="text-onyx-500 text-xs">Aujourd'hui</Text>
            <Text className={totalBalance >= 0 ? 'text-accent-success font-semibold' : 'text-accent-danger font-semibold'}>
              {formatCurrency(totalBalance)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-onyx-500 text-xs">J+30</Text>
            <Text
              className={
                chartData[chartData.length - 1]?.value >= 0 ? 'text-accent-success font-semibold' : 'text-accent-danger font-semibold'
              }
            >
              {formatCurrency(chartData[chartData.length - 1]?.value ?? 0)}
            </Text>
          </View>
        </View>
        {hasNegative && (
          <View className="mt-2 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-accent-danger" />
            <Text className="text-accent-danger text-xs ml-2">Solde négatif prévu sur la période</Text>
          </View>
        )}
      </GlassCard>
    </View>
  );
}
