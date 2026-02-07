// ============================================
// ONYX - Carte transaction prévue
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Icons from 'lucide-react-native';
import type { PlannedTransaction } from '@/types';
import { usePlannedTransactionStore } from '@/stores/plannedTransactionStore';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  planned: PlannedTransaction;
  overdue?: boolean;
}

export function PlannedTransactionCard({ planned, overdue }: Props) {
  const realizePlannedTransaction = usePlannedTransactionStore((s) => s.realizePlannedTransaction);
  const cancelPlannedTransaction = usePlannedTransactionStore((s) => s.cancelPlannedTransaction);

  const handleRealize = () => {
    Alert.alert(
      'Réaliser la transaction',
      'Créer cette transaction maintenant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Créer', onPress: () => realizePlannedTransaction(planned.id) },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler la transaction prévue',
      'Êtes-vous sûr ?',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui', style: 'destructive', onPress: () => cancelPlannedTransaction(planned.id) },
      ]
    );
  };

  const dateStr = format(parseISO(planned.plannedDate), 'EEEE d MMM yyyy', { locale: fr });
  const isIncome = planned.type === 'income';

  return (
    <GlassCard className={`mb-2 ${overdue ? 'border-l-4 border-red-500' : ''}`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-white font-semibold" numberOfLines={1}>
            {planned.description || 'Sans description'}
          </Text>
          <Text className="text-onyx-500 text-sm mt-0.5">
            {dateStr}
            {overdue && ' • En retard'}
            {planned.isRecurring && ' • 🔁 Récurrent'}
          </Text>
        </View>
        <Text
          className="text-lg font-bold"
          style={{ color: isIncome ? '#10B981' : '#EF4444' }}
        >
          {isIncome ? '+' : '−'}{formatCurrency(planned.amount)}
        </Text>
      </View>
      <View className="flex-row" style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={handleRealize}
          className="flex-1 py-2.5 rounded-xl items-center"
          style={{ backgroundColor: 'rgba(99, 102, 241, 0.3)' }}
        >
          <Icons.Check size={18} color="#6366F1" />
          <Text className="text-accent-primary text-sm font-semibold mt-1">Réaliser</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCancel}
          className="flex-1 py-2.5 rounded-xl items-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <Icons.X size={18} color="#71717A" />
          <Text className="text-onyx-500 text-sm font-semibold mt-1">Annuler</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}
