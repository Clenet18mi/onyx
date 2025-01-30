// ============================================
// ONYX - Add Transaction Screen
// Écran d'ajout de transaction
// ============================================

import React, { useState } from 'react';
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

export default function AddTransactionScreen() {
  const router = useRouter();
  const { accountId: defaultAccountId } = useLocalSearchParams<{ accountId?: string }>();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [accountId, setAccountId] = useState(defaultAccountId || '');
  
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  // Sélectionner le premier compte si aucun n'est sélectionné
  React.useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.CircleDot;
  };

  const filteredCategories = CATEGORIES.filter(
    (c) => c.type === type || c.type === 'both'
  );

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
      return;
    }

    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addTransaction({
      accountId,
      type,
      category,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      date: new Date().toISOString(),
    });

    router.back();
  };

  const handleNumberPad = (value: string) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (value === 'delete') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (value === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => prev + '.');
      }
    } else {
      // Limiter à 2 décimales
      const parts = amount.split('.');
      if (parts[1]?.length >= 2) return;
      setAmount((prev) => prev + value);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.X size={24} color="#71717A" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Nouvelle Transaction</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Type Toggle */}
          <View className="px-6 mb-6">
            <View 
              className="flex-row rounded-2xl p-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
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
          </View>

          {/* Amount Display */}
          <View className="px-6 mb-8 items-center">
            <Text className="text-onyx-500 text-sm mb-2">Montant</Text>
            <Text 
              className="text-5xl font-bold"
              style={{ color: type === 'income' ? '#10B981' : '#EF4444' }}
            >
              {type === 'income' ? '+' : '-'}{amount || '0'} €
            </Text>
          </View>

          {/* Account Selector */}
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Compte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{ gap: 8 }}>
                {accounts.map((account) => {
                  const AccountIcon = getIcon(account.icon);
                  const isSelected = accountId === account.id;
                  return (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() => setAccountId(account.id)}
                      className={`px-4 py-3 rounded-xl flex-row items-center ${
                        isSelected ? 'border-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? `${account.color}20` : 'rgba(255, 255, 255, 0.08)',
                        borderColor: isSelected ? account.color : 'transparent',
                      }}
                    >
                      <AccountIcon size={18} color={isSelected ? account.color : '#71717A'} />
                      <Text 
                        className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-onyx-500'}`}
                      >
                        {account.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Category Selector */}
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Catégorie</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {filteredCategories.map((cat) => {
                const CatIcon = getIcon(cat.icon);
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl flex-row items-center ${
                      isSelected ? 'border' : ''
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? `${cat.color}20` : 'rgba(255, 255, 255, 0.08)',
                      borderColor: isSelected ? cat.color : 'transparent',
                    }}
                  >
                    <CatIcon size={16} color={isSelected ? cat.color : '#71717A'} />
                    <Text 
                      className={`ml-2 text-sm font-medium ${isSelected ? 'text-white' : 'text-onyx-500'}`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Description (optionnel)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Courses supermarché"
              placeholderTextColor="#52525B"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          {/* Number Pad */}
          <View className="px-6 mb-6">
            <View className="flex-row flex-wrap justify-center" style={{ gap: 12 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleNumberPad(value)}
                  className="w-20 h-16 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                  {value === 'delete' ? (
                    <Icons.Delete size={24} color="#71717A" />
                  ) : (
                    <Text className="text-white text-2xl font-semibold">{value}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <View className="px-6 mb-8">
            <Button
              title="Enregistrer"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSave}
              icon={<Icons.Check size={20} color="white" />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
