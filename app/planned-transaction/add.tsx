// ============================================
// ONYX - Ajout transaction prévue
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, usePlannedTransactionStore } from '@/stores';
import { CATEGORIES, TransactionCategory } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PlannedType = 'expense' | 'income';

const QUICK_DATES = [
  { label: 'Aujourd\'hui', get: () => new Date() },
  { label: 'Demain', get: () => addDays(new Date(), 1) },
  { label: 'Dans 7 j', get: () => addDays(new Date(), 7) },
  { label: 'Dans 30 j', get: () => addDays(new Date(), 30) },
];

export default function AddPlannedTransactionScreen() {
  const router = useRouter();
  const accounts = useAccountStore((s) => s.getActiveAccounts());
  const addPlannedTransaction = usePlannedTransactionStore((s) => s.addPlannedTransaction);

  const [type, setType] = useState<PlannedType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [plannedDate, setPlannedDate] = useState(addDays(new Date(), 7));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');

  React.useEffect(() => {
    if (accounts.length && !accountId) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const filteredCategories = CATEGORIES.filter((c) => c.type === type || c.type === 'both');

  const handleSave = () => {
    const amountNum = parseFloat(amount?.replace(',', '.') ?? '0');
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description');
      return;
    }

    addPlannedTransaction({
      type,
      amount: amountNum,
      category,
      accountId,
      plannedDate: plannedDate.toISOString(),
      description: description.trim(),
      note: note.trim() || undefined,
      isRecurring: isRecurring || undefined,
      recurrence: isRecurring ? { frequency, interval: 1 } : undefined,
    });
    router.back();
  };

  const getIcon = (name: string) => (Icons as any)[name] || Icons.CircleDot;

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.X size={24} color="#71717A" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Prévoir une transaction</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6 flex-row rounded-2xl p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity
              onPress={() => setType('expense')}
              className={`flex-1 py-3 rounded-xl ${type === 'expense' ? 'bg-accent-danger' : ''}`}
            >
              <Text className={`text-center font-semibold ${type === 'expense' ? 'text-white' : 'text-onyx-500'}`}>
                Dépense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType('income')}
              className={`flex-1 py-3 rounded-xl ${type === 'income' ? 'bg-accent-success' : ''}`}
            >
              <Text className={`text-center font-semibold ${type === 'income' ? 'text-white' : 'text-onyx-500'}`}>
                Revenu
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Montant (€)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor="#52525B"
              keyboardType="decimal-pad"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-lg"
            />
          </View>

          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Date prévue</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {QUICK_DATES.map(({ label, get }) => {
                const d = get();
                const selected = format(d, 'yyyy-MM-dd') === format(plannedDate, 'yyyy-MM-dd');
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setPlannedDate(d)}
                    className={`px-4 py-3 rounded-xl ${selected ? 'bg-accent-primary' : ''}`}
                    style={!selected ? { backgroundColor: 'rgba(255,255,255,0.08)' } : undefined}
                  >
                    <Text className={selected ? 'text-white font-semibold' : 'text-onyx-500'}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="text-onyx-500 text-sm mt-2">
              {format(plannedDate, "EEEE d MMMM yyyy", { locale: fr })}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Compte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{ gap: 8 }}>
                {accounts.map((acc) => {
                  const Icon = getIcon(acc.icon);
                  const sel = accountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setAccountId(acc.id)}
                      className={`px-4 py-3 rounded-xl flex-row items-center ${sel ? 'border-2' : ''}`}
                      style={{
                        backgroundColor: sel ? `${acc.color}20` : 'rgba(255,255,255,0.08)',
                        borderColor: sel ? acc.color : 'transparent',
                      }}
                    >
                      <Icon size={18} color={sel ? acc.color : '#71717A'} />
                      <Text className={`ml-2 font-medium ${sel ? 'text-white' : 'text-onyx-500'}`}>{acc.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Catégorie</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {filteredCategories.map((cat) => {
                const Icon = getIcon(cat.icon);
                const sel = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl flex-row items-center ${sel ? 'border' : ''}`}
                    style={{
                      backgroundColor: sel ? `${cat.color}20` : 'rgba(255,255,255,0.08)',
                      borderColor: sel ? cat.color : 'transparent',
                    }}
                  >
                    <Icon size={16} color={sel ? cat.color : '#71717A'} />
                    <Text className={`ml-2 text-sm font-medium ${sel ? 'text-white' : 'text-onyx-500'}`}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Loyer, Courses..."
              placeholderTextColor="#52525B"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl"
            />
          </View>

          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Note (optionnel)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="..."
              placeholderTextColor="#52525B"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl"
            />
          </View>

          <GlassCard className="mb-6 flex-row items-center justify-between">
            <Text className="text-white font-medium">Récurrent</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: '#3F3F46', true: '#6366F1' }}
              thumbColor="#fff"
            />
          </GlassCard>

          {isRecurring && (
            <View className="mb-6 flex-row" style={{ gap: 8 }}>
              {(['weekly', 'monthly'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  className={`flex-1 py-3 rounded-xl ${frequency === f ? 'bg-accent-primary' : 'bg-onyx-100'}`}
                >
                  <Text className={`text-center font-medium ${frequency === f ? 'text-white' : 'text-onyx-500'}`}>
                    {f === 'weekly' ? 'Hebdo' : 'Mensuel'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Button
            title="Enregistrer"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSave}
            icon={<Icons.CalendarClock size={20} color="white" />}
          />
          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
