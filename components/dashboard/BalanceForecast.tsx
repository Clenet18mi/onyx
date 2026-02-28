// ============================================
// ONYX - Balance Forecast
// Projection du solde sur 30 jours (abonnements + prévus + salaire)
// ============================================

import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAccountStore, useTransactionStore, useConfigStore, useSubscriptionStore, usePlannedTransactionStore } from '@/stores';
import { formatCurrency, safeParseISO } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { addDays, differenceInDays, getDate, startOfDay, isWithinInterval } from 'date-fns';

const { width } = Dimensions.get('window');

export function BalanceForecast() {
  const totalBalance = useAccountStore((s) => s.getTotalBalance());
  const transactions = useTransactionStore((s) => s.transactions);
  const profile = useConfigStore((s) => s.profile);
  const subscriptions = useSubscriptionStore((s) => s.subscriptions).filter((s) => s.isActive);
  const plannedTransactions = usePlannedTransactionStore((s) => s.plannedTransactions);

  const now = new Date();
  const todayStart = startOfDay(now);
  const end30 = addDays(todayStart, 30);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysElapsed = differenceInDays(now, thisMonthStart) + 1;
  const thisMonthExpenses = transactions
    .filter((t) => {
      const d = safeParseISO(t.date);
      return d != null && d >= thisMonthStart && d <= now && t.type !== 'transfer' && t.type === 'expense';
    })
    .reduce((s, t) => s + t.amount, 0);
  const dailyAvg = daysElapsed > 0 ? thisMonthExpenses / daysElapsed : 0;
  const salaryDay = profile.salaryDay;
  const salaryAmount = profile.defaultSalaryAmount ?? 0;

  const { projectedBalance, expectedIncomes, expectedExpenses, salaryIn30, plannedIncomeCount, plannedExpenseCount, subCountIn30 } = useMemo(() => {
    const pending = plannedTransactions.filter((pt) => pt.status === 'pending');
    const plannedIn30 = pending.filter((pt) => {
      const d = safeParseISO(pt.plannedDate);
      return d != null && isWithinInterval(startOfDay(d), { start: todayStart, end: end30 });
    });
    const plannedIncome = plannedIn30.filter((pt) => pt.type === 'income').reduce((s, pt) => s + pt.amount, 0);
    const plannedExpense = plannedIn30.filter((pt) => pt.type === 'expense').reduce((s, pt) => s + pt.amount, 0);
    const plannedIncomeN = plannedIn30.filter((pt) => pt.type === 'income').length;
    const plannedExpenseN = plannedIn30.filter((pt) => pt.type === 'expense').length;

    let subTotal = 0;
    let subCount = 0;
    subscriptions.forEach((sub) => {
      const next = safeParseISO(sub.nextBillingDate);
      if (next != null && isWithinInterval(startOfDay(next), { start: todayStart, end: end30 })) {
        subTotal += sub.amount;
        subCount += 1;
      }
    });

    const hasSalaryThisMonth = transactions.some((t) => {
      const d = safeParseISO(t.date);
      return d != null && t.type !== 'transfer' && t.type === 'income' && t.category === 'salary' && isWithinInterval(d, { start: thisMonthStart, end: now });
    });
    let salaryIn30Amount = 0;
    for (let i = 0; i <= 30; i++) {
      const d = addDays(now, i);
      if (salaryDay != null && getDate(d) === salaryDay && salaryAmount > 0 && !hasSalaryThisMonth) {
        salaryIn30Amount = salaryAmount;
        break;
      }
    }

    const expectedIncomes = salaryIn30Amount + plannedIncome;
    const expectedExpenses = subTotal + plannedExpense;
    const projected = totalBalance + expectedIncomes - expectedExpenses;

    return {
      projectedBalance: projected,
      expectedIncomes,
      expectedExpenses,
      salaryIn30: salaryIn30Amount,
      plannedIncomeCount: plannedIncomeN,
      plannedExpenseCount: plannedExpenseN,
      subCountIn30: subCount,
    };
  }, [totalBalance, transactions, profile, subscriptions, plannedTransactions, todayStart, end30, thisMonthStart, now, salaryDay, salaryAmount]);

  // Recompute when balance, transactions or planned change
  const chartData = useMemo(() => {
    const points: { value: number; label: string; dataPointText?: string }[] = [];
    let balance = totalBalance;
    for (let i = 0; i <= 30; i++) {
      const d = addDays(now, i);
      if (i > 0) {
        balance -= dailyAvg;
        if (salaryDay != null && getDate(d) === salaryDay && salaryAmount > 0) balance += salaryAmount;
        subscriptions.forEach((sub) => {
          const next = safeParseISO(sub.nextBillingDate);
          if (next == null) return;
          const nextDay = startOfDay(next);
          const diff = differenceInDays(nextDay, todayStart);
          if (diff === i) balance -= sub.amount;
        });
        plannedTransactions
          .filter((pt) => pt.status === 'pending')
          .forEach((pt) => {
            const plannedDay = safeParseISO(pt.plannedDate);
            if (plannedDay == null) return;
            const dayStart = startOfDay(plannedDay);
            const diff = differenceInDays(dayStart, todayStart);
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
  }, [totalBalance, dailyAvg, salaryDay, salaryAmount, subscriptions, transactions.length, plannedTransactions, now, todayStart]);

  const minBalance = Math.min(...chartData.map((p) => p.value));
  const maxBalance = Math.max(...chartData.map((p) => p.value));
  const hasNegative = minBalance < 0;
  const projectedNegative = projectedBalance < 0;
  const projectedLow = totalBalance > 0 && projectedBalance < totalBalance * 0.2;

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">📈</Text>
        <Text className="text-white text-lg font-semibold">Prévision de solde</Text>
      </View>
      <GlassCard>
        <Text className="text-onyx-500 text-sm mb-2">Prochaines 30 jours</Text>
        <View className="mb-3">
          <Text className="text-onyx-500 text-xs">Dans 30 jours</Text>
          <Text
            className={`text-2xl font-bold ${projectedNegative ? 'text-accent-danger' : projectedLow ? 'text-amber-400' : 'text-white'}`}
          >
            {formatCurrency(projectedBalance)}
          </Text>
        </View>
        {(expectedIncomes > 0 || expectedExpenses > 0) && (
          <View className="mb-3 gap-1">
            {expectedIncomes > 0 && (
              <Text className="text-accent-success text-xs">
                ↑ +{formatCurrency(expectedIncomes)} attendus
                {salaryIn30 > 0 && plannedIncomeCount > 0 && ` (salaire + ${plannedIncomeCount} transaction(s))`}
                {salaryIn30 > 0 && plannedIncomeCount === 0 && ' (salaire)'}
                {salaryIn30 === 0 && plannedIncomeCount > 0 && ` (${plannedIncomeCount} transaction(s))`}
              </Text>
            )}
            {expectedExpenses > 0 && (
              <Text className="text-accent-danger text-xs">
                ↓ -{formatCurrency(expectedExpenses)} prévus
                {subCountIn30 > 0 && plannedExpenseCount > 0 && ` (${subCountIn30} abonnement(s) + ${plannedExpenseCount} transaction(s))`}
                {subCountIn30 > 0 && plannedExpenseCount === 0 && ` (${subCountIn30} abonnement(s))`}
                {subCountIn30 === 0 && plannedExpenseCount > 0 && ` (${plannedExpenseCount} transaction(s))`}
              </Text>
            )}
          </View>
        )}
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
        {projectedNegative && (
          <View className="mt-2 flex-row items-center">
            <Text className="text-accent-danger text-xs font-medium">⚠️ Solde négatif prévu</Text>
          </View>
        )}
        {!projectedNegative && projectedLow && (
          <View className="mt-2 flex-row items-center">
            <Text className="text-amber-400 text-xs font-medium">Attention au solde</Text>
          </View>
        )}
      </GlassCard>
    </View>
  );
}
