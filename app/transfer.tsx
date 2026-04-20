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
import { useTheme } from '@/hooks/useTheme';

export default function TransferScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const addTransfer = useTransactionStore((state) => state.addTransfer);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  React.useEffect(() => {
    const fromExists = accounts.some((a) => a.id === fromAccountId);
    const toExists = accounts.some((a) => a.id === toAccountId);
    if (accounts.length >= 2) {
      if (!fromExists) setFromAccountId(accounts[0].id);
      if (!toExists) setToAccountId(accounts[1].id);
    } else if (accounts.length === 1) {
      if (!fromExists) setFromAccountId(accounts[0].id);
      setToAccountId('');
    } else {
      setFromAccountId('');
      setToAccountId('');
    }
  }, [accounts]);

  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.Wallet;
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const swapAccounts = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleTransfer = () => {
    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) { Alert.alert('Erreur', 'Veuillez entrer un montant valide'); return; }
    if (!fromAccountId || !toAccountId) { Alert.alert('Erreur', 'Veuillez sélectionner les deux comptes'); return; }
    if (fromAccountId === toAccountId) { Alert.alert('Erreur', 'Les comptes source et destination doivent être différents'); return; }
    if (fromAccount && fromAccount.balance < transferAmount) { Alert.alert('Erreur', 'Solde insuffisant sur le compte source'); return; }
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTransfer(fromAccountId, toAccountId, transferAmount, description.trim() || `Virement vers ${toAccount?.name}`);
    router.back();
  };

  if (accounts.length < 2) {
    return (
      <LinearGradient colors={colors.gradients.card} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Icons.AlertCircle size={64} color={colors.accent.warning} />
          <Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '700', marginTop: 24, textAlign: 'center' }}>Vous avez besoin d'au moins 2 comptes</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 15, marginTop: 8, textAlign: 'center' }}>Créez un autre compte pour effectuer des virements</Text>
          <Button title="Créer un compte" variant="primary" onPress={() => { router.back(); router.push('/accounts'); }} className="mt-6" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}><Icons.X size={24} color={colors.text.secondary} /></TouchableOpacity>
          <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>Virement</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 mb-8 items-center">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Montant à transférer</Text>
            <Text style={{ color: colors.text.primary, fontSize: 54, fontWeight: '700' }}>{amount || '0'} €</Text>
          </View>

          <View className="px-6 mb-6">
            <View className="mb-4">
              <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>De</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}><View className="flex-row" style={{ gap: 8 }}>{accounts.filter((a) => a.id !== toAccountId).map((account) => { const AccountIcon = getIcon(account.icon); const isSelected = fromAccountId === account.id; return (<TouchableOpacity key={account.id} onPress={() => setFromAccountId(account.id)} className="p-4 rounded-xl" style={{ backgroundColor: isSelected ? `${account.color}20` : colors.background.secondary, borderWidth: 1, borderColor: isSelected ? account.color : colors.background.tertiary, minWidth: 140 }}><View className="flex-row items-center mb-2"><AccountIcon size={18} color={isSelected ? account.color : colors.text.secondary} /><Text className="ml-2 font-medium" style={{ color: isSelected ? colors.text.primary : colors.text.secondary }} numberOfLines={1}>{account.name}</Text></View><Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>{formatCurrency(account.balance)}</Text></TouchableOpacity>); })}</View></ScrollView>
            </View>
            <View className="items-center my-2"><TouchableOpacity onPress={swapAccounts} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: `${colors.accent.primary}20` }}><Icons.ArrowUpDown size={24} color={colors.accent.primary} /></TouchableOpacity></View>
            <View>
              <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Vers</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}><View className="flex-row" style={{ gap: 8 }}>{accounts.filter((a) => a.id !== fromAccountId).map((account) => { const AccountIcon = getIcon(account.icon); const isSelected = toAccountId === account.id; return (<TouchableOpacity key={account.id} onPress={() => setToAccountId(account.id)} className="p-4 rounded-xl" style={{ backgroundColor: isSelected ? `${account.color}20` : colors.background.secondary, borderWidth: 1, borderColor: isSelected ? account.color : colors.background.tertiary, minWidth: 140 }}><View className="flex-row items-center mb-2"><AccountIcon size={18} color={isSelected ? account.color : colors.text.secondary} /><Text className="ml-2 font-medium" style={{ color: isSelected ? colors.text.primary : colors.text.secondary }} numberOfLines={1}>{account.name}</Text></View><Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>{formatCurrency(account.balance)}</Text></TouchableOpacity>); })}</View></ScrollView>
            </View>
          </View>

          {fromAccount && toAccount ? (
            <View className="px-6 mb-6">
              <GlassCard>
                <View className="flex-row items-center justify-between">
                  <View className="items-center flex-1">
                    <View className="w-12 h-12 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${fromAccount.color}20` }}>{React.createElement(getIcon(fromAccount.icon), { size: 24, color: fromAccount.color })}</View>
                    <Text numberOfLines={1} style={{ color: colors.text.primary, fontWeight: '600' }}>{fromAccount.name}</Text>
                  </View>
                  <View className="mx-4"><Icons.ArrowRight size={24} color={colors.accent.primary} /></View>
                  <View className="items-center flex-1">
                    <View className="w-12 h-12 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${toAccount.color}20` }}>{React.createElement(getIcon(toAccount.icon), { size: 24, color: toAccount.color })}</View>
                    <Text numberOfLines={1} style={{ color: colors.text.primary, fontWeight: '600' }}>{toAccount.name}</Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          ) : null}

          <View className="px-6 mb-6">
            <Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Note (optionnel)</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Ex: Épargne mensuelle" placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} />
          </View>

          <View className="px-6 mb-6">
            <View className="flex-row flex-wrap justify-center" style={{ gap: 12 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map((value) => (
                <TouchableOpacity key={value} onPress={() => (hapticEnabled ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) : null) || (value === 'delete' ? setAmount((prev) => prev.slice(0, -1)) : value === '.' ? (!amount.includes('.') ? setAmount((prev) => prev + '.') : null) : ((amount.split('.')[1]?.length ?? 0) >= 2 ? null : setAmount((prev) => prev + value)))} className="w-20 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}>
                  {value === 'delete' ? <Icons.Delete size={24} color={colors.text.secondary} /> : <Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '700' }}>{value}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="px-6 mb-8"><Button title="Effectuer le virement" variant="primary" size="lg" fullWidth onPress={handleTransfer} icon={<Icons.ArrowLeftRight size={20} color="white" />} /></View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
