import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import type { PlannedTransaction } from '@/types';
import { formatCurrency, safeParseISO } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  planned: PlannedTransaction;
  overdue?: boolean;
  tone?: 'income' | 'expense' | 'default';
}

export function PlannedTransactionCard({ planned, overdue, tone = 'default' }: Props) {
  const router = useRouter();

  const handleOpenDetails = () => {
    router.push(`/planned-transaction/${planned.id}`);
  };

  const plannedDateParsed = safeParseISO(planned.plannedDate);
  const dateStr = plannedDateParsed ? format(plannedDateParsed, 'EEEE d MMM yyyy', { locale: fr }) : '—';
  const isIncome = planned.type === 'income';
  const tintColor = tone === 'income' ? 'rgba(16, 185, 129, 0.10)' : tone === 'expense' ? 'rgba(239, 68, 68, 0.10)' : 'transparent';
  const borderColor = tone === 'income' ? 'rgba(16, 185, 129, 0.16)' : tone === 'expense' ? 'rgba(239, 68, 68, 0.16)' : undefined;
  const containerStyle = borderColor ? { backgroundColor: tintColor, borderColor } : undefined;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handleOpenDetails}>
      <GlassCard className={`mb-2 ${overdue ? 'border-l-4 border-red-500' : ''}`} style={containerStyle}>
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 pr-3">
            <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
              <Text className="text-white font-semibold" numberOfLines={1}>
                {planned.description || 'Sans description'}
              </Text>
              {overdue && (
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.16)' }}>
                  <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '700' }}>EN RETARD</Text>
                </View>
              )}
              {planned.isRecurring && (
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139, 92, 246, 0.18)' }}>
                  <Text style={{ color: '#C4B5FD', fontSize: 11, fontWeight: '700' }}>RÉCURRENT</Text>
                </View>
              )}
            </View>
            <Text className="text-onyx-500 text-sm mt-1" numberOfLines={1}>{dateStr}</Text>
          </View>
          <Text className="text-lg font-bold" style={{ color: isIncome ? '#10B981' : '#EF4444' }}>
            {isIncome ? '+' : '−'}{formatCurrency(planned.amount)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between pt-2">
          <Text className="text-onyx-500 text-xs">Appuyez pour ouvrir</Text>
          <Icons.ChevronRight size={16} color="#71717A" />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}
