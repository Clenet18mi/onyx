// ============================================
// ONYX - Accounts Screen
// Liste des comptes avec gestion
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, useTransactionStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { Account, ACCOUNT_TYPES, AVAILABLE_COLORS } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

// Liste des icônes disponibles
const AVAILABLE_ICONS = [
  'Wallet', 'PiggyBank', 'Banknote', 'TrendingUp', 'Bitcoin',
  'Building', 'CreditCard', 'Landmark', 'Coins', 'DollarSign',
  'Euro', 'Briefcase', 'Home', 'Car', 'ShoppingBag',
];

export default function AccountsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('checking');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [icon, setIcon] = useState('Wallet');
  
  const { accounts, addAccount, updateAccount, deleteAccount, getTotalBalance } = useAccountStore();
  const transactions = useTransactionStore((state) => state.transactions);
  
  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const totalBalance = getTotalBalance();

  const resetForm = () => {
    setName('');
    setType('checking');
    setBalance('');
    setColor(AVAILABLE_COLORS[0]);
    setIcon('Wallet');
    setEditingAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setBalance(account.balance.toString());
    setColor(account.color);
    setIcon(account.icon);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du compte est requis');
      return;
    }

    const accountData = {
      name: name.trim(),
      type: type as any,
      balance: parseFloat(balance) || 0,
      color,
      icon,
      currency: 'EUR',
      isArchived: false,
    };

    if (editingAccount) {
      updateAccount(editingAccount.id, accountData);
    } else {
      addAccount(accountData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (account: Account) => {
    const accountTransactions = transactions.filter(
      (t) => t.accountId === account.id || t.toAccountId === account.id
    );

    if (accountTransactions.length > 0) {
      Alert.alert(
        'Attention',
        `Ce compte contient ${accountTransactions.length} transaction(s). Voulez-vous vraiment le supprimer ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => deleteAccount(account.id),
          },
        ]
      );
    } else {
      Alert.alert(
        'Supprimer le compte',
        `Voulez-vous supprimer "${account.name}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => deleteAccount(account.id),
          },
        ]
      );
    }
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
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-white text-2xl font-bold mb-1">Mes Comptes</Text>
          <Text className="text-onyx-500">
            Total: {formatCurrency(totalBalance)}
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Liste des comptes */}
          {activeAccounts.map((account) => {
            const Icon = getIcon(account.icon);
            const accountType = ACCOUNT_TYPES.find((t) => t.id === account.type);
            
            return (
              <TouchableOpacity
                key={account.id}
                onPress={() => router.push(`/account/${account.id}`)}
                onLongPress={() => openEditModal(account)}
                className="mb-3"
              >
                <GlassCard>
                  <View className="flex-row items-center">
                    <View 
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Icon size={24} color={account.color} />
                    </View>
                    
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold">{account.name}</Text>
                      <Text className="text-onyx-500 text-sm">{accountType?.label || 'Compte'}</Text>
                    </View>
                    
                    <View className="items-end">
                      <Text 
                        className="text-xl font-bold"
                        style={{ color: account.balance >= 0 ? '#10B981' : '#EF4444' }}
                      >
                        {formatCurrency(account.balance)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}

          {/* Bouton Ajouter */}
          <TouchableOpacity
            onPress={openAddModal}
            className="mb-6 p-4 rounded-2xl items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderStyle: 'dashed',
            }}
          >
            <Icons.Plus size={24} color="#6366F1" />
            <Text className="text-accent-primary font-medium mt-2">Ajouter un compte</Text>
          </TouchableOpacity>

          <View className="h-24" />
        </ScrollView>

        {/* Modal Ajout/Modification */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-onyx">
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-onyx-200/10">
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text className="text-onyx-500 text-base">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">
                  {editingAccount ? 'Modifier' : 'Nouveau Compte'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text className="text-accent-primary text-base font-semibold">Enregistrer</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                {/* Nom */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Nom du compte</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Compte Courant"
                    placeholderTextColor="#52525B"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Type */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Type de compte</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 8 }}>
                      {ACCOUNT_TYPES.map((accountType) => {
                        const TypeIcon = getIcon(accountType.icon);
                        return (
                          <TouchableOpacity
                            key={accountType.id}
                            onPress={() => setType(accountType.id)}
                            className={`px-4 py-3 rounded-xl flex-row items-center ${
                              type === accountType.id ? 'bg-accent-primary' : 'bg-onyx-100'
                            }`}
                          >
                            <TypeIcon size={18} color={type === accountType.id ? 'white' : '#71717A'} />
                            <Text 
                              className={`ml-2 font-medium ${
                                type === accountType.id ? 'text-white' : 'text-onyx-500'
                              }`}
                            >
                              {accountType.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Solde initial */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Solde initial</Text>
                  <TextInput
                    value={balance}
                    onChangeText={setBalance}
                    placeholder="0.00"
                    placeholderTextColor="#52525B"
                    keyboardType="decimal-pad"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Couleur */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Couleur</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                    {AVAILABLE_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setColor(c)}
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          color === c ? 'border-2 border-white' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Icons.Check size={20} color="white" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Icône */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Icône</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                    {AVAILABLE_ICONS.map((iconName) => {
                      const IconComp = getIcon(iconName);
                      return (
                        <TouchableOpacity
                          key={iconName}
                          onPress={() => setIcon(iconName)}
                          className={`w-12 h-12 rounded-xl items-center justify-center ${
                            icon === iconName ? 'bg-accent-primary' : 'bg-onyx-100'
                          }`}
                        >
                          <IconComp size={24} color={icon === iconName ? 'white' : '#71717A'} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Bouton Supprimer */}
                {editingAccount && (
                  <Button
                    title="Supprimer ce compte"
                    variant="danger"
                    fullWidth
                    onPress={() => {
                      setModalVisible(false);
                      handleDelete(editingAccount);
                    }}
                    icon={<Icons.Trash2 size={18} color="white" />}
                  />
                )}

                <View className="h-12" />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
