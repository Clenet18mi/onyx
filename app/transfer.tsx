// ============================================
// ONYX - Transfer Screen
// Écran de virement entre comptes
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAccountStore, useTransactionStore, useSettingsStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

export default function TransferScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  const addTransfer = useTransactionStore((state) => state.addTransfer);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  // Sélectionner les premiers comptes par défaut
  React.useEffect(() => {
    if (accounts.length >= 2) {
      setFromAccountId(accounts[0].id);
      setToAccountId(accounts[1].id);
    } else if (accounts.length === 1) {
      setFromAccountId(accounts[0].id);
    }
  }, [accounts]);

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Wallet;
  };

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const swapAccounts = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleTransfer = () => {
    const transferAmount = parseFloat(amount);
    
    if (!transferAmount || transferAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner les deux comptes');
      return;
    }
    if (fromAccountId === toAccountId) {
      Alert.alert('Erreur', 'Les comptes source et destination doivent être différents');
      return;
    }
    if (fromAccount && fromAccount.balance < transferAmount) {
      Alert.alert('Erreur', 'Solde insuffisant sur le compte source');
      return;
    }

    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addTransfer(
      fromAccountId,
      toAccountId,
      transferAmount,
      description.trim() || `Virement vers ${toAccount?.name}`
    );

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
      const parts = amount.split('.');
      if (parts[1]?.length >= 2) return;
      setAmount((prev) => prev + value);
    }
  };

  if (accounts.length < 2) {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Icons.AlertCircle size={64} color="#F59E0B" />
          <Text className="text-white text-xl font-semibold mt-6 text-center">
            Vous avez besoin d'au moins 2 comptes
          </Text>
          <Text className="text-onyx-500 text-base mt-2 text-center">
            Créez un autre compte pour effectuer des virements
          </Text>
          <Button
            title="Créer un compte"
            variant="primary"
            onPress={() => {
              router.back();
              router.push('/accounts');
            }}
            className="mt-6"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          <Text className="text-white text-lg font-semibold">Virement</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View className="px-6 mb-8 items-center">
            <Text className="text-onyx-500 text-sm mb-2">Montant à transférer</Text>
            <Text className="text-white text-5xl font-bold">
              {amount || '0'} €
            </Text>
          </View>

          {/* Account Selection */}
          <View className="px-6 mb-6">
            {/* From Account */}
            <View className="mb-4">
              <Text className="text-onyx-500 text-sm mb-2">De</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row" style={{ gap: 8 }}>
                  {accounts.filter((a) => a.id !== toAccountId).map((account) => {
                    const AccountIcon = getIcon(account.icon);
                    const isSelected = fromAccountId === account.id;
                    return (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => setFromAccountId(account.id)}
                        className={`p-4 rounded-xl ${isSelected ? 'border-2' : ''}`}
                        style={{ 
                          backgroundColor: isSelected ? `${account.color}20` : 'rgba(255, 255, 255, 0.08)',
                          borderColor: isSelected ? account.color : 'transparent',
                          minWidth: 140,
                        }}
                      >
                        <View className="flex-row items-center mb-2">
                          <AccountIcon size={18} color={isSelected ? account.color : '#71717A'} />
                          <Text 
                            className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-onyx-500'}`}
                            numberOfLines={1}
                          >
                            {account.name}
                          </Text>
                        </View>
                        <Text className="text-white text-lg font-semibold">
                          {formatCurrency(account.balance)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Swap Button */}
            <View className="items-center my-2">
              <TouchableOpacity
                onPress={swapAccounts}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
              >
                <Icons.ArrowUpDown size={24} color="#6366F1" />
              </TouchableOpacity>
            </View>

            {/* To Account */}
            <View>
              <Text className="text-onyx-500 text-sm mb-2">Vers</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row" style={{ gap: 8 }}>
                  {accounts.filter((a) => a.id !== fromAccountId).map((account) => {
                    const AccountIcon = getIcon(account.icon);
                    const isSelected = toAccountId === account.id;
                    return (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => setToAccountId(account.id)}
                        className={`p-4 rounded-xl ${isSelected ? 'border-2' : ''}`}
                        style={{ 
                          backgroundColor: isSelected ? `${account.color}20` : 'rgba(255, 255, 255, 0.08)',
                          borderColor: isSelected ? account.color : 'transparent',
                          minWidth: 140,
                        }}
                      >
                        <View className="flex-row items-center mb-2">
                          <AccountIcon size={18} color={isSelected ? account.color : '#71717A'} />
                          <Text 
                            className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-onyx-500'}`}
                            numberOfLines={1}
                          >
                            {account.name}
                          </Text>
                        </View>
                        <Text className="text-white text-lg font-semibold">
                          {formatCurrency(account.balance)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Visual Transfer */}
          {fromAccount && toAccount && (
            <View className="px-6 mb-6">
              <GlassCard>
                <View className="flex-row items-center justify-between">
                  <View className="items-center flex-1">
                    <View 
                      className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                      style={{ backgroundColor: `${fromAccount.color}20` }}
                    >
                      {React.createElement(getIcon(fromAccount.icon), { size: 24, color: fromAccount.color })}
                    </View>
                    <Text className="text-white font-medium" numberOfLines={1}>{fromAccount.name}</Text>
                  </View>
                  
                  <View className="mx-4">
                    <Icons.ArrowRight size={24} color="#6366F1" />
                  </View>
                  
                  <View className="items-center flex-1">
                    <View 
                      className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                      style={{ backgroundColor: `${toAccount.color}20` }}
                    >
                      {React.createElement(getIcon(toAccount.icon), { size: 24, color: toAccount.color })}
                    </View>
                    <Text className="text-white font-medium" numberOfLines={1}>{toAccount.name}</Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Description */}
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Note (optionnel)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Épargne mensuelle"
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
                  className="w-20 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                  {value === 'delete' ? (
                    <Icons.Delete size={24} color="#71717A" />
                  ) : (
                    <Text className="text-white text-xl font-semibold">{value}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Transfer Button */}
          <View className="px-6 mb-8">
            <Button
              title="Effectuer le virement"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleTransfer}
              icon={<Icons.ArrowLeftRight size={20} color="white" />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
