// ============================================
// ONYX - Profile Settings Screen
// Configuration du profil utilisateur
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useConfigStore, useAccountStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse' },
  { code: 'CAD', symbol: 'C$', label: 'Dollar Canadien' },
  { code: 'JPY', symbol: '¥', label: 'Yen' },
];

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useConfigStore();
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  
  const [name, setName] = useState(profile.name);
  const [currency, setCurrency] = useState(profile.currency);
  const [salaryDay, setSalaryDay] = useState(profile.salaryDay?.toString() || '');
  const [defaultSalaryAmount, setDefaultSalaryAmount] = useState(profile.defaultSalaryAmount?.toString() || '');
  const [defaultSalaryAccountId, setDefaultSalaryAccountId] = useState(profile.defaultSalaryAccountId || '');

  const handleSave = () => {
    updateProfile({
      name: name.trim(),
      currency,
      salaryDay: salaryDay ? parseInt(salaryDay) : undefined,
      defaultSalaryAmount: defaultSalaryAmount ? parseFloat(defaultSalaryAmount) : undefined,
      defaultSalaryAccountId: defaultSalaryAccountId || undefined,
    });
    
    Alert.alert('Succès', 'Profil mis à jour !');
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Wallet;
  };

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Icons.ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Mon Profil</Text>
          </View>
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-accent-primary font-semibold">Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Nom */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Votre prénom (optionnel)</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Jean"
              placeholderTextColor="#52525B"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
            />
            <Text className="text-onyx-600 text-xs mt-1">
              Utilisé pour personnaliser les messages de l'app
            </Text>
          </View>

          {/* Devise */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Devise principale</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => setCurrency(curr.code)}
                  className={`px-4 py-3 rounded-xl ${currency === curr.code ? 'bg-accent-primary' : 'bg-onyx-100'}`}
                >
                  <Text className={`font-medium ${currency === curr.code ? 'text-white' : 'text-onyx-500'}`}>
                    {curr.symbol} {curr.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section Salaire */}
          <GlassCard className="mb-6">
            <View className="flex-row items-center mb-4">
              <Icons.Banknote size={20} color="#10B981" />
              <Text className="text-white text-lg font-semibold ml-2">Configuration du Salaire</Text>
            </View>
            
            {/* Jour du salaire */}
            <View className="mb-4">
              <Text className="text-onyx-500 text-sm mb-2">Jour du mois où vous recevez votre salaire</Text>
              <TextInput
                value={salaryDay}
                onChangeText={(text) => {
                  const num = parseInt(text);
                  if (!text || (num >= 1 && num <= 31)) {
                    setSalaryDay(text);
                  }
                }}
                placeholder="Ex: 25"
                placeholderTextColor="#52525B"
                keyboardType="number-pad"
                maxLength={2}
                className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            
            {/* Montant du salaire */}
            <View className="mb-4">
              <Text className="text-onyx-500 text-sm mb-2">Montant habituel de votre salaire</Text>
              <TextInput
                value={defaultSalaryAmount}
                onChangeText={setDefaultSalaryAmount}
                placeholder="Ex: 2500"
                placeholderTextColor="#52525B"
                keyboardType="decimal-pad"
                className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            
            {/* Compte par défaut */}
            {accounts.length > 0 && (
              <View>
                <Text className="text-onyx-500 text-sm mb-2">Compte qui reçoit le salaire</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {accounts.map((account) => {
                      const AccountIcon = getIcon(account.icon);
                      const isSelected = defaultSalaryAccountId === account.id;
                      return (
                        <TouchableOpacity
                          key={account.id}
                          onPress={() => setDefaultSalaryAccountId(account.id)}
                          className={`px-4 py-3 rounded-xl flex-row items-center ${isSelected ? 'border' : ''}`}
                          style={{ 
                            backgroundColor: isSelected ? `${account.color}20` : 'rgba(255, 255, 255, 0.08)',
                            borderColor: isSelected ? account.color : 'transparent',
                          }}
                        >
                          <AccountIcon size={18} color={isSelected ? account.color : '#71717A'} />
                          <Text className={`ml-2 ${isSelected ? 'text-white' : 'text-onyx-500'}`}>
                            {account.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </GlassCard>

          {/* Info */}
          <View className="mb-8 p-4 rounded-xl" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
            <View className="flex-row items-start">
              <Icons.Info size={18} color="#6366F1" />
              <Text className="text-onyx-500 text-sm ml-2 flex-1">
                Ces informations sont utilisées pour pré-remplir le formulaire "Payday" et vous rappeler quand votre salaire arrive.
              </Text>
            </View>
          </View>

          <Button
            title="Enregistrer les modifications"
            variant="primary"
            fullWidth
            onPress={handleSave}
            icon={<Icons.Check size={20} color="white" />}
          />

          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
