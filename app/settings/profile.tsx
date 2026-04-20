import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useConfigStore, useAccountStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { useTheme } from '@/hooks/useTheme';

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
  const { theme } = useTheme();
  const { colors } = theme;
  const { profile, updateProfile } = useConfigStore();
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));

  const [name, setName] = useState(profile.name);
  const [currency, setCurrency] = useState(profile.currency);
  const [salaryDay, setSalaryDay] = useState(profile.salaryDay?.toString() || '');
  const [defaultSalaryAmount, setDefaultSalaryAmount] = useState(profile.defaultSalaryAmount?.toString() || '');
  const [defaultSalaryAccountId, setDefaultSalaryAccountId] = useState(profile.defaultSalaryAccountId || '');

  const handleSave = () => {
    updateProfile({ name: name.trim(), currency, salaryDay: salaryDay ? parseInt(salaryDay) : undefined, defaultSalaryAmount: defaultSalaryAmount ? parseFloat(defaultSalaryAmount) : undefined, defaultSalaryAccountId: defaultSalaryAccountId || undefined });
    Alert.alert('Succès', 'Profil mis à jour !');
  };

  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.Wallet;

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}>
              <Icons.ChevronLeft size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>Mon Profil</Text>
          </View>
          <TouchableOpacity onPress={handleSave}><Text style={{ color: colors.accent.primary, fontWeight: '700' }}>Enregistrer</Text></TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Votre prénom (optionnel)</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Ex: Jean" placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} />
            <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>Utilisé pour personnaliser les messages de l'app</Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Devise principale</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity key={curr.code} onPress={() => setCurrency(curr.code)} className="px-4 py-3 rounded-xl" style={{ backgroundColor: currency === curr.code ? `${colors.accent.primary}20` : colors.background.secondary, borderWidth: 1, borderColor: currency === curr.code ? colors.accent.primary : colors.background.tertiary }}>
                  <Text className="font-medium" style={{ color: currency === curr.code ? colors.text.primary : colors.text.secondary }}>{curr.symbol} {curr.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <GlassCard className="mb-6">
            <View className="flex-row items-center mb-4"><Icons.Banknote size={20} color={colors.accent.success} /><Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700', marginLeft: 8 }}>Configuration du Salaire</Text></View>
            <View className="mb-4"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Jour du mois où vous recevez votre salaire</Text><TextInput value={salaryDay} onChangeText={(text) => { const num = parseInt(text); if (!text || (num >= 1 && num <= 31)) setSalaryDay(text); }} placeholder="Ex: 25" placeholderTextColor={colors.text.tertiary} keyboardType="number-pad" maxLength={2} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
            <View className="mb-4"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Montant habituel de votre salaire</Text><TextInput value={defaultSalaryAmount} onChangeText={setDefaultSalaryAmount} placeholder="Ex: 2500" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
            {accounts.length > 0 ? (
              <View>
                <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Compte qui reçoit le salaire</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}><View className="flex-row" style={{ gap: 8 }}>{accounts.map((account) => { const AccountIcon = getIcon(account.icon); const isSelected = defaultSalaryAccountId === account.id; return (<TouchableOpacity key={account.id} onPress={() => setDefaultSalaryAccountId(account.id)} className="px-4 py-3 rounded-xl flex-row items-center" style={{ backgroundColor: isSelected ? `${account.color}20` : colors.background.secondary, borderWidth: 1, borderColor: isSelected ? account.color : colors.background.tertiary }}><AccountIcon size={18} color={isSelected ? account.color : colors.text.secondary} /><Text className="ml-2" style={{ color: isSelected ? colors.text.primary : colors.text.secondary }}>{account.name}</Text></TouchableOpacity>); })}</View></ScrollView>
              </View>
            ) : null}
          </GlassCard>

          <View className="mb-8 p-4 rounded-xl" style={{ backgroundColor: `${colors.accent.primary}12`, borderWidth: 1, borderColor: `${colors.accent.primary}20` }}>
            <View className="flex-row items-start"><Icons.Info size={18} color={colors.accent.primary} /><Text className="text-sm ml-2 flex-1" style={{ color: colors.text.secondary }}>Ces informations sont utilisées pour pré-remplir le formulaire "Payday" et vous rappeler quand votre salaire arrive.</Text></View>
          </View>

          <Button title="Enregistrer les modifications" variant="primary" fullWidth onPress={handleSave} icon={<Icons.Check size={20} color="white" />} />
          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
