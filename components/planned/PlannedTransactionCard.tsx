// ============================================
// ONYX - Carte transaction prévue
// ============================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import * as Icons from 'lucide-react-native';
import type { PlannedTransaction } from '@/types';
import { usePlannedTransactionStore } from '@/stores/plannedTransactionStore';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeParseISO } from '@/utils/format';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  planned: PlannedTransaction;
  overdue?: boolean;
}

export function PlannedTransactionCard({ planned, overdue }: Props) {
  const realizePlannedTransaction = usePlannedTransactionStore((s) => s.realizePlannedTransaction);
  const cancelPlannedTransaction = usePlannedTransactionStore((s) => s.cancelPlannedTransaction);
  const updatePlannedTransaction = usePlannedTransactionStore((s) => s.updatePlannedTransaction);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => safeParseISO(planned.plannedDate) ?? new Date());

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

  const handleChangeDate = () => {
    setPickerDate(safeParseISO(planned.plannedDate) ?? new Date());
    setShowDatePicker(true);
  };

  const onDatePickerChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) {
      const dateOnly = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
      updatePlannedTransaction(planned.id, { plannedDate: dateOnly.toISOString() });
    }
  };

  const confirmDatePicker = () => {
    const dateOnly = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate());
    updatePlannedTransaction(planned.id, { plannedDate: dateOnly.toISOString() });
    setShowDatePicker(false);
  };

  const plannedDateParsed = safeParseISO(planned.plannedDate);
  const dateStr = plannedDateParsed ? format(plannedDateParsed, 'EEEE d MMM yyyy', { locale: fr }) : '—';
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
          onPress={handleChangeDate}
          className="flex-1 py-2.5 rounded-xl items-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <Icons.Calendar size={18} color="#71717A" />
          <Text className="text-onyx-500 text-sm font-semibold mt-1">Changer la date</Text>
        </TouchableOpacity>
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

      {showDatePicker && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal visible transparent animationType="slide">
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
                className="flex-1 justify-end"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <View className="bg-onyx p-4 rounded-t-2xl">
                  <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text className="text-onyx-500">Annuler</Text>
                    </TouchableOpacity>
                    <Text className="text-white font-semibold">Nouvelle date</Text>
                    <TouchableOpacity onPress={confirmDatePicker}>
                      <Text className="text-accent-primary font-semibold">OK</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    onChange={(_, d) => d && setPickerDate(d)}
                    locale="fr-FR"
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="default"
              onChange={onDatePickerChange}
            />
          )}
        </>
      )}
    </GlassCard>
  );
}
