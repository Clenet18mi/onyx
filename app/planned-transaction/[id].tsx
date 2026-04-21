import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePlannedTransactionStore } from '@/stores/plannedTransactionStore';
import { useAccountStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency, safeParseISO } from '@/utils/format';
import { openNativeDatePicker } from '@/utils/datePicker';

export default function PlannedTransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const planned = usePlannedTransactionStore((s) => (id ? s.plannedTransactions.find((pt) => pt.id === id) : undefined));
  const updatePlannedTransaction = usePlannedTransactionStore((s) => s.updatePlannedTransaction);
  const realizePlannedTransaction = usePlannedTransactionStore((s) => s.realizePlannedTransaction);
  const deletePlannedTransaction = usePlannedTransactionStore((s) => s.deletePlannedTransaction);
  const account = useAccountStore((s) => (planned ? s.accounts.find((a) => a.id === planned.accountId) : undefined));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => safeParseISO(planned?.plannedDate) ?? new Date());

  useEffect(() => {
    setPickerDate(safeParseISO(planned?.plannedDate) ?? new Date());
  }, [planned?.plannedDate]);

  if (!planned) {
    return (
      <LinearGradient colors={colors.gradients.card} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>Transaction prévue introuvable</Text>
          <Button title="Retour" variant="primary" className="mt-4" onPress={() => router.back()} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const dateStr = safeParseISO(planned.plannedDate) ? format(safeParseISO(planned.plannedDate)!, 'EEEE d MMM yyyy', { locale: fr }) : '—';

  const saveDate = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    updatePlannedTransaction(planned.id, { plannedDate: dateOnly.toISOString() });
  };

  const openDatePicker = () => {
    openNativeDatePicker({
      value: pickerDate,
      minimumDate: new Date(),
      onPick: (date) => {
        setPickerDate(date);
        saveDate(date);
      },
      onFallback: () => setShowDatePicker(true),
    });
  };

  const handleRealize = () => {
    Alert.alert('Créer la transaction', 'Créer cette transaction maintenant ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Créer', onPress: () => { realizePlannedTransaction(planned.id); router.back(); } },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Supprimer', 'Supprimer cette transaction prévue ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { deletePlannedTransaction(planned.id); router.back(); } },
    ]);
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>Transaction prévue</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <GlassCard className="mb-4">
            <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Libellé</Text>
            <Text style={{ color: colors.text.primary, fontSize: 22, fontWeight: '700', marginTop: 6 }}>{planned.description || 'Sans description'}</Text>
            <Text style={{ color: colors.text.secondary, marginTop: 10 }}>{planned.type === 'income' ? 'Revenu' : 'Dépense'} · {formatCurrency(planned.amount)}</Text>
            <Text style={{ color: colors.text.secondary, marginTop: 4 }}>{account?.name ?? 'Compte inconnu'}</Text>
            <Text style={{ color: colors.text.secondary, marginTop: 4 }}>{dateStr}</Text>
          </GlassCard>

          <View className="mb-4">
            <Button title="Changer la date" variant="secondary" fullWidth onPress={openDatePicker} icon={<Icons.Calendar size={18} color={colors.text.primary} />} />
          </View>
          <View className="mb-4">
            <Button title="Créer" variant="primary" fullWidth onPress={handleRealize} icon={<Icons.Check size={18} color="#fff" />} />
          </View>
          <View className="mb-4">
            <Button title="Supprimer" variant="danger" fullWidth onPress={handleDelete} icon={<Icons.Trash2 size={18} color="#fff" />} />
          </View>

          {showDatePicker ? (
            <Modal visible transparent animationType="slide">
              <TouchableOpacity activeOpacity={1} onPress={() => setShowDatePicker(false)} className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View className="p-4 rounded-t-2xl" style={{ backgroundColor: colors.background.secondary }}>
                  <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: colors.text.secondary }}>Annuler</Text>
                    </TouchableOpacity>
                    <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Choisir la date</Text>
                    <TouchableOpacity onPress={() => { saveDate(pickerDate); setShowDatePicker(false); }}>
                      <Text style={{ color: colors.accent.primary, fontWeight: '700' }}>OK</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker value={pickerDate} mode="date" display="spinner" onChange={(_, d) => d && setPickerDate(d)} locale="fr-FR" />
                </View>
              </TouchableOpacity>
            </Modal>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
