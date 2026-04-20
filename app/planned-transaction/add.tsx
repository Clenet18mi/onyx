import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, usePlannedTransactionStore, useConfigStore } from '@/stores';
import { TransactionCategory } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';

function toLocalDateIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

type PlannedType = 'expense' | 'income';
const QUICK_DATES = [{ label: 'Aujourd\'hui', get: () => new Date() }, { label: 'Demain', get: () => addDays(new Date(), 1) }, { label: 'Dans 7 j', get: () => addDays(new Date(), 7) }, { label: 'Dans 30 j', get: () => addDays(new Date(), 30) }, { label: 'Autre date', get: null as unknown as () => Date }];

export default function AddPlannedTransactionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const accounts = useAccountStore((s) => s.accounts.filter((a) => !a.isArchived));
  const addPlannedTransaction = usePlannedTransactionStore((s) => s.addPlannedTransaction);
  const getVisibleCategories = useConfigStore((s) => s.getVisibleCategories);
  const [type, setType] = useState<PlannedType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [plannedDate, setPlannedDate] = useState(addDays(new Date(), 7));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  React.useEffect(() => { if (accounts.length && !accountId) setAccountId(accounts[0].id); }, [accounts, accountId]);
  const filteredCategories = getVisibleCategories(type === 'income' ? 'income' : 'expense');
  const getIcon = (name: string) => (Icons as any)[name] || Icons.CircleDot;

  const handleSave = () => {
    const amountNum = parseFloat(amount?.replace(',', '.') ?? '0');
    if (!amount || isNaN(amountNum) || amountNum <= 0) { Alert.alert('Erreur', 'Veuillez entrer un montant valide'); return; }
    if (!accountId) { Alert.alert('Erreur', 'Veuillez sélectionner un compte'); return; }
    if (!description.trim()) { Alert.alert('Erreur', 'Veuillez entrer une description'); return; }
    addPlannedTransaction({ type, amount: amountNum, category, accountId, plannedDate: toLocalDateIso(plannedDate), description: description.trim(), note: note.trim() || undefined, isRecurring: isRecurring || undefined, recurrence: isRecurring ? { frequency, interval: 1 } : undefined });
    router.back();
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}><Icons.X size={24} color={colors.text.secondary} /></TouchableOpacity>
          <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>Prévoir une transaction</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6 flex-row rounded-2xl p-1" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}>
            <TouchableOpacity onPress={() => setType('expense')} className="flex-1 py-3 rounded-xl" style={{ backgroundColor: type === 'expense' ? colors.accent.danger : 'transparent' }}><Text className="text-center font-semibold" style={{ color: type === 'expense' ? '#fff' : colors.text.secondary }}>Dépense</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setType('income')} className="flex-1 py-3 rounded-xl" style={{ backgroundColor: type === 'income' ? colors.accent.success : 'transparent' }}><Text className="text-center font-semibold" style={{ color: type === 'income' ? '#fff' : colors.text.secondary }}>Revenu</Text></TouchableOpacity>
          </View>

          <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Montant (€)</Text><TextInput value={amount} onChangeText={setAmount} placeholder="0,00" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" className="px-4 py-3 rounded-xl text-lg" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>

          <View className="mb-5">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Date prévue</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {QUICK_DATES.map(({ label, get }) => {
                if (label === 'Autre date') {
                  return (
                    <TouchableOpacity key={label} onPress={() => setShowCustomDatePicker(true)} className="px-4 py-3 rounded-xl" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}>
                      <Text style={{ color: colors.text.secondary }}>Autre date</Text>
                    </TouchableOpacity>
                  );
                }
                const d = get!();
                const selected = format(d, 'yyyy-MM-dd') === format(plannedDate, 'yyyy-MM-dd');
                return (
                  <TouchableOpacity key={label} onPress={() => setPlannedDate(d)} className="px-4 py-3 rounded-xl" style={{ backgroundColor: selected ? `${colors.accent.primary}20` : colors.background.secondary, borderWidth: 1, borderColor: selected ? colors.accent.primary : colors.background.tertiary }}>
                    <Text style={{ color: selected ? colors.text.primary : colors.text.secondary, fontWeight: selected ? '700' : '500' }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="text-sm mt-2" style={{ color: colors.text.secondary }}>{format(plannedDate, "EEEE d MMMM yyyy", { locale: fr })}</Text>
          </View>

          <GlassCard className="mb-6 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Paiement régulier</Text>
              <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Crée une transaction prévue qui se répète automatiquement.</Text>
            </View>
            <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} />
          </GlassCard>

          {isRecurring ? (
            <View className="mb-6">
              <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Fréquence</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {(['weekly', 'monthly'] as const).map((f) => (
                  <TouchableOpacity key={f} onPress={() => setFrequency(f)} className="flex-1 py-3 rounded-xl" style={{ backgroundColor: frequency === f ? colors.accent.primary : colors.background.secondary, borderWidth: 1, borderColor: frequency === f ? colors.accent.primary : colors.background.tertiary }}>
                    <Text className="text-center font-medium" style={{ color: frequency === f ? '#fff' : colors.text.secondary }}>{f === 'weekly' ? 'Hebdo' : 'Mensuel'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {showCustomDatePicker ? (<>{Platform.OS === 'ios' ? (<Modal visible transparent animationType="slide"><TouchableOpacity activeOpacity={1} onPress={() => setShowCustomDatePicker(false)} className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}><View className="p-4 rounded-t-2xl" style={{ backgroundColor: colors.background.secondary }}><View className="flex-row justify-between items-center mb-4"><TouchableOpacity onPress={() => setShowCustomDatePicker(false)}><Text style={{ color: colors.text.secondary }}>Annuler</Text></TouchableOpacity><Text style={{ color: colors.text.primary, fontWeight: '700' }}>Choisir la date</Text><TouchableOpacity onPress={() => setShowCustomDatePicker(false)}><Text style={{ color: colors.accent.primary, fontWeight: '700' }}>OK</Text></TouchableOpacity></View><DateTimePicker value={plannedDate} mode="date" display="spinner" onChange={(_, d) => d && setPlannedDate(d)} locale="fr-FR" /></View></TouchableOpacity></Modal>) : (<DateTimePicker value={plannedDate} mode="date" display="default" onChange={(_, d) => { if (d) setPlannedDate(d); setShowCustomDatePicker(false); }} />)}</>) : null}

          <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Compte</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View className="flex-row" style={{ gap: 8 }}>{accounts.map((acc) => { const Icon = getIcon(acc.icon); const sel = accountId === acc.id; return (<TouchableOpacity key={acc.id} onPress={() => setAccountId(acc.id)} className="px-4 py-3 rounded-xl flex-row items-center" style={{ backgroundColor: sel ? `${acc.color}20` : colors.background.secondary, borderWidth: 1, borderColor: sel ? acc.color : colors.background.tertiary }}><Icon size={18} color={sel ? acc.color : colors.text.secondary} /><Text className="ml-2 font-medium" style={{ color: sel ? colors.text.primary : colors.text.secondary }}>{acc.name}</Text></TouchableOpacity>); })}</View></ScrollView></View>

          <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Catégorie</Text><View className="flex-row flex-wrap" style={{ gap: 8 }}>{filteredCategories.map((cat) => { const Icon = getIcon(cat.icon); const sel = category === cat.id; return (<TouchableOpacity key={cat.id} onPress={() => setCategory(cat.id)} className="px-3 py-2 rounded-xl flex-row items-center" style={{ backgroundColor: sel ? `${cat.color}20` : colors.background.secondary, borderWidth: 1, borderColor: sel ? cat.color : colors.background.tertiary }}><Icon size={16} color={sel ? cat.color : colors.text.secondary} /><Text className="ml-2 text-sm font-medium" style={{ color: sel ? colors.text.primary : colors.text.secondary }}>{cat.label}</Text></TouchableOpacity>); })}</View></View>

          <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Description</Text><TextInput value={description} onChangeText={setDescription} placeholder="Ex: Loyer, Courses..." placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
          <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Note (optionnel)</Text><TextInput value={note} onChangeText={setNote} placeholder="..." placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>

          <Button title="Enregistrer" variant="primary" size="lg" fullWidth onPress={handleSave} icon={<Icons.CalendarClock size={20} color="white" />} />
          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
