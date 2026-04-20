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
import { useAccountStore, useTransactionStore, useSettingsStore, useConfigStore } from '@/stores';
import { TransactionCategory, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const getTransaction = useTransactionStore((s) => s.getTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const accounts = useAccountStore((s) => s.accounts.filter((a) => !a.isArchived));
  const getCategoryById = useConfigStore((s) => s.getCategoryById);
  const getVisibleCategories = useConfigStore((s) => s.getVisibleCategories);
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
  const filteredCategories = getVisibleCategories(type === 'income' ? 'income' : type === 'expense' ? 'expense' : undefined);

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
    const cat = getCategoryById(tx.category);
    Alert.alert('Supprimer', `Supprimer cette ${tx.type === 'income' ? 'entrée' : 'dépense'} de ${formatCurrency(tx.amount)}${tx.description ? ` — ${tx.description}` : ''} du ${formatDate(tx.date)} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        deleteTransaction(id);
        if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }},
    ]);
  };

  const handleDuplicate = () => {
    if (!tx) return;
    router.push({
      pathname: '/transaction/add',
      params: {
        prefill: JSON.stringify({
          amount: tx.amount,
          category: tx.category,
          description: tx.description ?? '',
          accountId: tx.accountId,
          type: tx.type,
        }),
      },
    });
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
      <LinearGradient colors={colors.gradients.card} className="flex-1 items-center justify-center">
        <Text style={{ color: colors.text.primary }}>Transaction introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 rounded-xl" style={{ backgroundColor: colors.accent.primary }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: colors.text.primary }}>Modifier</Text>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <TouchableOpacity onPress={handleDuplicate}>
              <Icons.Copy size={22} color={colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Icons.Trash2 size={22} color={colors.accent.danger} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 mb-6">
            <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}>
              {(['expense', 'income'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  className="flex-1 py-3 rounded-xl"
                  style={{ backgroundColor: type === t ? (t === 'income' ? colors.accent.success : colors.accent.danger) : 'transparent' }}
                >
                  <Text className="text-center font-semibold" style={{ color: type === t ? '#fff' : colors.text.secondary }}>
                    {t === 'expense' ? 'Dépense' : 'Revenu'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View className="px-6 mb-8 items-center">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Montant</Text>
            <TouchableOpacity activeOpacity={1} onPress={() => amountInputRef.current?.focus()} className="flex-row items-center justify-center min-h-[72px]">
              <Text className="text-4xl font-bold mr-1" style={{ color: type === 'income' ? colors.accent.success : colors.accent.danger }}>{type === 'income' ? '+' : '-'}</Text>
              <TextInput
                ref={amountInputRef}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                className="text-4xl font-bold text-center px-2 py-1"
                style={{ color: type === 'income' ? colors.accent.success : colors.accent.danger, minWidth: 100 }}
                selectTextOnFocus
              />
              <Text className="text-4xl font-bold ml-1" style={{ color: type === 'income' ? colors.accent.success : colors.accent.danger }}> €</Text>
            </TouchableOpacity>
          </View>
          <View className="px-6 mb-6">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Compte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{ gap: 8 }}>
                {accounts.map((account) => {
                  const Icon = getIcon(account.icon);
                  const sel = accountId === account.id;
                  return (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() => setAccountId(account.id)}
                      className="px-4 py-3 rounded-xl flex-row items-center"
                      style={{ backgroundColor: sel ? `${account.color}20` : colors.background.secondary, borderWidth: sel ? 1 : 1, borderColor: sel ? account.color : colors.background.tertiary }}
                    >
                      <Icon size={18} color={sel ? account.color : colors.text.secondary } />
                      <Text className="ml-2 font-medium" style={{ color: sel ? colors.text.primary : colors.text.secondary }}>{account.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
          <View className="px-6 mb-6">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Catégorie</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {filteredCategories.map((cat) => {
                const Icon = getIcon(cat.icon);
                const sel = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className="px-3 py-2 rounded-xl flex-row items-center"
                    style={{ backgroundColor: sel ? `${cat.color}20` : colors.background.secondary, borderWidth: 1, borderColor: sel ? cat.color : colors.background.tertiary }}
                  >
                    <Icon size={16} color={sel ? cat.color : colors.text.secondary} />
                    <Text className="ml-2 text-sm font-medium" style={{ color: sel ? colors.text.primary : colors.text.secondary }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View className="px-6 mb-6">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} />
          </View>
          <View className="px-6 mb-8">
            <Button title="Enregistrer" variant="primary" size="lg" fullWidth onPress={handleSave} icon={<Icons.Check size={20} color="white" />} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
