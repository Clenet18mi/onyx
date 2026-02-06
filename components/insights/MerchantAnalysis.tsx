// ============================================
// ONYX - Merchant Analysis
// Top commerçants, stats par marchand
// ============================================

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as Icons from 'lucide-react-native';
import { useMerchantStore } from '@/stores/merchantStore';
import { useTransactionStore } from '@/stores';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';

const MAX_TOP = 10;

export function MerchantAnalysis() {
  const transactions = useTransactionStore((s) => s.transactions);
  const getMerchantsStats = useMerchantStore((s) => s.getMerchantsStats);
  const getTopMerchants = useMerchantStore((s) => s.getTopMerchants);

  const allStats = useMemo(() => getMerchantsStats(), [getMerchantsStats, transactions.length]);
  const topMerchants = useMemo(() => getTopMerchants(MAX_TOP), [getTopMerchants, transactions.length]);

  if (allStats.length === 0) {
    return (
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl mr-2">🏪</Text>
          <Text className="text-white text-lg font-semibold">Par commerçant</Text>
        </View>
        <GlassCard>
          <Text className="text-onyx-500 text-sm">Aucune dépense avec description enregistrée.</Text>
          <Text className="text-onyx-500 text-xs mt-1">Les descriptions permettent d'extraire le nom du commerçant.</Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">🏪</Text>
        <Text className="text-white text-lg font-semibold">Par commerçant</Text>
      </View>
      <GlassCard>
        <Text className="text-onyx-500 text-sm mb-3">Top {MAX_TOP} ce mois</Text>
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          {topMerchants.map((m, i) => (
            <TouchableOpacity
              key={m.name + m.lastDate}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: i < topMerchants.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <View className="flex-1">
                <Text className="text-white font-medium" numberOfLines={1}>
                  {m.name}
                </Text>
                <Text className="text-onyx-500 text-xs mt-0.5">
                  {m.count} visite{m.count > 1 ? 's' : ''} · moy. {formatCurrency(m.average)} · Dernier: {formatShortDate(m.lastDate)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-semibold">{formatCurrency(m.thisMonth)}</Text>
                <Text
                  className="text-xs"
                  style={{
                    color: m.variationPercent > 0 ? '#EF4444' : m.variationPercent < 0 ? '#10B981' : '#71717A',
                  }}
                >
                  {m.variationPercent >= 0 ? '+' : ''}{m.variationPercent.toFixed(0)}% vs mois dernier
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GlassCard>
    </View>
  );
}
