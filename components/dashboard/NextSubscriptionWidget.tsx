// ============================================
// ONYX - Next Subscription Widget
// Prochain abonnement à débiter sur le dashboard
// ============================================

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { differenceInDays, parseISO, startOfDay, isToday } from 'date-fns';
import { useSubscriptionStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';

export function NextSubscriptionWidget() {
  const router = useRouter();
  const subscriptions = useSubscriptionStore((s) => s.subscriptions.filter((sub) => sub.isActive));

  const next = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = subscriptions
      .filter((s) => parseISO(s.nextBillingDate).getTime() >= today.getTime())
      .sort((a, b) => parseISO(a.nextBillingDate).getTime() - parseISO(b.nextBillingDate).getTime());
    return upcoming[0] ?? null;
  }, [subscriptions]);

  if (!next) return null;

  const billingDate = parseISO(next.nextBillingDate);
  const days = differenceInDays(billingDate, startOfDay(new Date()));
  let label = '';
  if (isToday(billingDate)) label = "aujourd'hui ⚠️";
  else if (days === 1) label = 'demain';
  else label = `dans ${days} jours`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/subscription/${next.id}`)}
      className="mb-6"
    >
      <GlassCard variant="light" className="py-3 px-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-onyx-500 text-sm">📅 Prochain débit</Text>
          <Text className="text-onyx-400 text-xs">{label}</Text>
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-white font-semibold">{next.name}</Text>
          <Text className="text-accent-danger font-semibold">{formatCurrency(next.amount)}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}
