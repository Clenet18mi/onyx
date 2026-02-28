// ============================================
// ONYX - Next Subscription Widget
// Prochain abonnement à débiter sur le dashboard
// ============================================

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { differenceInDays, startOfDay, isToday } from 'date-fns';
import { useSubscriptionStore } from '@/stores';
import { formatCurrency, safeParseISO } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';

export function NextSubscriptionWidget() {
  const router = useRouter();
  const subscriptions = useSubscriptionStore((s) => s.subscriptions.filter((sub) => sub.isActive));

  const next = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = subscriptions
      .map((s) => ({ sub: s, d: safeParseISO(s.nextBillingDate) }))
      .filter(({ d }) => d != null && d.getTime() >= today.getTime())
      .sort((a, b) => (a.d!.getTime()) - (b.d!.getTime()));
    return upcoming[0]?.sub ?? null;
  }, [subscriptions]);

  if (!next) return null;

  const billingDate = safeParseISO(next.nextBillingDate);
  if (!billingDate) return null;
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
