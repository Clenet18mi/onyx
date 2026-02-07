// ============================================
// ONYX - Edit Transaction
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAccountStore, useTransactionStore, useSettingsStore } from '@/stores';
import { CATEGORIES, TransactionCategory, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getTransaction = useTransactionStore((s) => s.getTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const accounts = useAccountStore((s) => s.getActiveAccounts());
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const tx = id ? getTransaction(id) : null;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [accountId, setAccountId] = useState('');
  const amountInputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    if (tx) {
      setType(tx.type);
      setAmount(String(tx.amount));
      setDescription(tx.description || '');
      setCategory(tx.category);
      setAccountId(tx.accountId);
    }
  }, [tx]);

  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.CircleDot;
  const filteredCategories = CATEGORIES.filter((c) => c.type === type || c.type === 'both');

  const handleSave = () => {
    if (!id || !tx) return;
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Sélectionnez un compte');
      return;
    }
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateTransaction(id, {
      type,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      category,
      accountId,
    });
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Supprimer', 'Supprimer cette transaction ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        deleteTransaction(id);
        if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }},
    ]);
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] != null && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  if (!tx) {
    return (
      <LinearGradient colors={['#0A0A0B', '#1F1F23']} className="flex-1 items-center justify-center">
        <Text className="text-white">Transaction introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 rounded-xl bg-accent-primary">
          <Text className="text-white font-medium">Retour</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.X size={24} color="#71717A" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Modifier</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Icons.Trash2 size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 mb-6">
            <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              {(['expense', 'income'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  className={`flex-1 py-3 rounded-xl ${type === t ? (t === 'income' ? 'bg-accent-success' : 'bg-accent-danger') : ''}`}
                >
                  <Text className={`text-center font-semibold ${type === t ? 'text-white' : 'text-onyx-500'}`}>
                    {t === 'expense' ? 'Dépense' : 'Revenu'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View className="px-6 mb-8 items-center">
            <Text className="text-onyx-500 text-sm mb-2">Montant</Text>
            <TouchableOpacity activeOpacity={1} onPress={() => amountInputRef.current?.focus()} className="flex-row items-center justify-center min-h-[72px]">
              <Text className="text-4xl font-bold mr-1" style={{ color: type === 'income' ? '#10B981' : '#EF4444' }}>{type === 'income' ? '+' : '-'}</Text>
              <TextInput
                ref={amountInputRef}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                className="text-4xl font-bold text-center px-2 py-1"
                style={{ color: type === 'income' ? '#10B981' : '#EF4444', minWidth: 100 }}
                selectTextOnFocus
              />
              <Text className="text-4xl font-bold ml-1" style={{ color: type === 'income' ? '#10B981' : '#EF4444' }}> €</Text>
            </TouchableOpacity>
          </View>
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Compte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{ gap: 8 }}>
                {accounts.map((account) => {
                  const Icon = getIcon(account.icon);
                  const sel = accountId === account.id;
                  return (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() => setAccountId(account.id)}
                      className={`px-4 py-3 rounded-xl flex-row items-center ${sel ? 'border-2' : ''}`}
                      style={{ backgroundColor: sel ? `${account.color}20` : 'rgba(255,255,255,0.08)', borderColor: sel ? account.color : 'transparent' }}
                    >
                      <Icon size={18} color={sel ? account.color : '#71717A' } />
                      <Text className={`ml-2 font-medium ${sel ? 'text-white' : 'text-onyx-500'}`}>{account.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
          <View className="px-6 mb-6">
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
                    style={{ backgroundColor: sel ? `${cat.color}20` : 'rgba(255,255,255,0.08)', borderColor: sel ? cat.color : 'transparent' }}
                  >
                    <Icon size={16} color={sel ? cat.color : '#71717A'} />
                    <Text className={`ml-2 text-sm font-medium ${sel ? 'text-white' : 'text-onyx-500'}`}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#52525B" className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base" />
          </View>
          <View className="px-6 mb-8">
            <Button title="Enregistrer" variant="primary" size="lg" fullWidth onPress={handleSave} icon={<Icons.Check size={20} color="white" />} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
