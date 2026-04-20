import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, useTransactionStore, usePlannedTransactionStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { Account, ACCOUNT_TYPES, AVAILABLE_COLORS } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

const AVAILABLE_ICONS = ['Wallet', 'PiggyBank', 'Banknote', 'TrendingUp', 'Bitcoin', 'Building', 'CreditCard', 'Landmark', 'Coins', 'DollarSign', 'Euro', 'Briefcase', 'Home', 'Car', 'ShoppingBag'];

export default function AccountsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('checking');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [icon, setIcon] = useState('Wallet');

  const { accounts, addAccount, updateAccount, deleteAccount, archiveAccount, getTotalBalance } = useAccountStore();
  const transactions = useTransactionStore((state) => state.transactions);
  const plannedTransactions = usePlannedTransactionStore((state) => state.plannedTransactions);

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const totalBalance = getTotalBalance();
  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.Wallet;
  const resetForm = () => { setName(''); setType('checking'); setBalance(''); setColor(AVAILABLE_COLORS[0]); setIcon('Wallet'); setEditingAccount(null); };
  const openAddModal = () => { resetForm(); setModalVisible(true); };
  const openEditModal = (account: Account) => { setEditingAccount(account); setName(account.name); setType(account.type); setBalance(account.balance.toString()); setColor(account.color); setIcon(account.icon); setModalVisible(true); };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Erreur', 'Le nom du compte est requis'); return; }
    const accountData = { name: name.trim(), type: type as any, balance: parseFloat(balance) || 0, color, icon, currency: 'EUR', isArchived: false };
    if (editingAccount) updateAccount(editingAccount.id, accountData); else addAccount(accountData);
    setModalVisible(false); resetForm();
  };

  const handleArchive = (account: Account) => { archiveAccount(account.id); setModalVisible(false); };

  const handleDelete = (account: Account) => {
    const linkedPlanned = plannedTransactions.filter((p) => p.accountId === account.id && p.status === 'pending');
    const accountTransactions = transactions.filter((t) => t.accountId === account.id || t.toAccountId === account.id);
    if (linkedPlanned.length > 0) {
      Alert.alert('Impossible de supprimer', `Ce compte est encore utilisé par ${linkedPlanned.length} transaction(s) prévue(s).`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Archiver à la place', onPress: () => handleArchive(account) }]);
      return;
    }
    if (accountTransactions.length > 0) {
      Alert.alert('Attention', `Ce compte contient ${accountTransactions.length} transaction(s). Voulez-vous vraiment le supprimer ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => deleteAccount(account.id) }]);
    } else {
      Alert.alert('Supprimer le compte', `Supprimer le compte "${account.name}" ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => deleteAccount(account.id) }]);
    }
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 pt-4 pb-3">
          <Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700' }}>Comptes</Text>
          <Text style={{ color: colors.text.secondary, marginTop: 4 }}>Total net · {formatCurrency(totalBalance)}</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <GlassCard variant="gradient" className="mb-5">
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Solde total</Text>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '700', marginTop: 8 }}>{formatCurrency(totalBalance)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 8 }}>{activeAccounts.length} compte{activeAccounts.length > 1 ? 's' : ''} actif{activeAccounts.length > 1 ? 's' : ''}</Text>
          </GlassCard>

          <Text className="text-xs uppercase tracking-[0.12em] mb-3" style={{ color: colors.text.secondary }}>Courants</Text>
          {activeAccounts.map((account) => {
            const Icon = getIcon(account.icon);
            const accountType = ACCOUNT_TYPES.find((t) => t.id === account.type);
            return (
              <TouchableOpacity key={account.id} onPress={() => router.push(`/account/${account.id}`)} onLongPress={() => openEditModal(account)} className="mb-3">
                <GlassCard>
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: `${account.color}20` }}>
                      <Icon size={24} color={account.color} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '600' }}>{account.name}</Text>
                      <Text style={{ color: colors.text.secondary, fontSize: 13 }}>{accountType?.label || 'Compte'}</Text>
                    </View>
                    <Text className="text-xl font-bold" style={{ color: account.balance >= 0 ? colors.accent.success : colors.accent.danger }}>{formatCurrency(account.balance)}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={openAddModal} className="mb-6 p-4 rounded-2xl items-center justify-center" style={{ backgroundColor: `${colors.background.secondary}90`, borderWidth: 1, borderColor: colors.background.tertiary, borderStyle: 'dashed' }}>
            <Icons.Plus size={24} color={colors.accent.primary} />
            <Text style={{ color: colors.accent.primary, fontWeight: '600', marginTop: 8 }}>Ajouter un compte</Text>
          </TouchableOpacity>

          <View className="h-24" />
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1" style={{ backgroundColor: colors.background.primary }}>
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.text.secondary }}>Annuler</Text></TouchableOpacity>
                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>{editingAccount ? 'Modifier' : 'Nouveau compte'}</Text>
                <TouchableOpacity onPress={handleSave}><Text style={{ color: colors.accent.primary, fontWeight: '700' }}>Enregistrer</Text></TouchableOpacity>
              </View>
              <ScrollView className="flex-1 px-6 py-4">
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Nom du compte</Text><TextInput value={name} onChangeText={setName} placeholder="Ex: Compte courant" placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Type de compte</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View className="flex-row" style={{ gap: 8 }}>{ACCOUNT_TYPES.map((accountType) => { const TypeIcon = getIcon(accountType.icon); return (<TouchableOpacity key={accountType.id} onPress={() => setType(accountType.id)} className="px-4 py-3 rounded-2xl flex-row items-center" style={{ backgroundColor: type === accountType.id ? `${colors.accent.primary}20` : colors.background.secondary, borderWidth: 1, borderColor: type === accountType.id ? colors.accent.primary : colors.background.tertiary }}><TypeIcon size={16} color={type === accountType.id ? colors.accent.primary : accountType.defaultColor} /><Text className="ml-2 font-medium" style={{ color: type === accountType.id ? colors.text.primary : colors.text.secondary }}>{accountType.label}</Text></TouchableOpacity>); })}</View></ScrollView></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Solde initial</Text><TextInput value={balance} onChangeText={setBalance} placeholder="0.00" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Icône</Text><View className="flex-row flex-wrap" style={{ gap: 10 }}>{AVAILABLE_ICONS.map((iconName) => { const IconComp = getIcon(iconName); return (<TouchableOpacity key={iconName} onPress={() => setIcon(iconName)} className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: icon === iconName ? `${colors.accent.primary}20` : colors.background.secondary, borderWidth: 1, borderColor: icon === iconName ? colors.accent.primary : colors.background.tertiary }}><IconComp size={22} color={icon === iconName ? colors.accent.primary : colors.text.secondary} /></TouchableOpacity>); })}</View></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Couleur</Text><View className="flex-row flex-wrap" style={{ gap: 10 }}>{AVAILABLE_COLORS.map((c) => (<TouchableOpacity key={c} onPress={() => setColor(c)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: c, borderWidth: color === c ? 2 : 1, borderColor: color === c ? '#fff' : colors.background.tertiary }}>{color === c && <Icons.Check size={18} color="white" />}</TouchableOpacity>))}</View></View>
                {editingAccount && (<Button title="Supprimer le compte" variant="danger" fullWidth onPress={() => handleDelete(editingAccount)} icon={<Icons.Trash2 size={18} color="white" />} />)}
                <View className="h-10" />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
