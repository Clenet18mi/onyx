// ============================================
// ONYX - Account Detail Screen
// Détail d'un compte avec transactions
// ============================================

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, useTransactionStore, useConfigStore, useSettingsStore } from '@/stores';
import { formatCurrency, formatDate, displayAmount, safeParseISO } from '@/utils/format';
import { Transaction, ACCOUNT_TYPES } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { SwipeableTransactionRow } from '@/components/ui/SwipeableTransactionRow';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const account = useAccountStore((state) => state.getAccount(id || ''));
  const getCategoryById = useConfigStore((state) => state.getCategoryById);
  const getTransactionsByAccount = useTransactionStore((state) => state.getTransactionsByAccount);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const privacyMode = useSettingsStore((state) => state.privacyMode ?? false);
  const currency = useSettingsStore((state) => state.currency);
  const locale = useSettingsStore((state) => state.locale);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const transactions = useMemo(() => {
    if (!id) return [];
    return getTransactionsByAccount(id).sort((a, b) => {
      const ta = safeParseISO(a.date)?.getTime() ?? 0;
      const tb = safeParseISO(b.date)?.getTime() ?? 0;
      return tb - ta;
    });
  }, [id, getTransactionsByAccount]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => {
      const desc = (t.description || '').toLowerCase();
      if (desc.includes(q)) return true;
      const amountStr = t.amount.toString();
      const amountFormatted = formatCurrency(t.amount).replace(/\s/g, '');
      if (amountStr.includes(q) || amountFormatted.replace(',', '.').includes(q)) return true;
      const num = parseFloat(q.replace(',', '.'));
      if (!isNaN(num) && (t.amount === num || amountStr.startsWith(q))) return true;
      return false;
    });
  }, [transactions, searchQuery]);

  if (!account) {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 items-center justify-center"
      >
        <Text className="text-white text-lg">Compte non trouvé</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-accent-primary rounded-xl"
        >
          <Text className="text-white font-medium">Retour</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Wallet;
  };

  const AccountIcon = getIcon(account.icon);
  const accountType = ACCOUNT_TYPES.find((t) => t.id === account.type);

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = getCategoryById(item.category);
    const CategoryIcon = category ? (Icons as any)[category.icon] : Icons.CircleDot;
    
    const isIncome = item.type === 'income';
    const isTransfer = item.type === 'transfer';
    const isOutgoing = item.accountId === id && isTransfer;
    
    let amountColor = isIncome ? '#10B981' : '#EF4444';
    let amountPrefix = isIncome ? '+' : '-';
    
    if (isTransfer) {
      amountColor = isOutgoing ? '#EF4444' : '#10B981';
      amountPrefix = isOutgoing ? '-' : '+';
    }

    const description = item.description || category?.label || 'Transaction';
    const deleteLabel = `Supprimer « ${description} » (${amountPrefix}${displayAmount(item.amount, privacyMode, currency, locale)}) ?`;

    return (
      <SwipeableTransactionRow
        onPress={() => router.push(`/transaction/${item.id}`)}
        onDelete={() => deleteTransaction(item.id)}
        deleteLabel={deleteLabel}
        hapticEnabled={hapticEnabled}
      >
        <View className="flex-row items-center py-3 border-b border-onyx-200/10">
          <View 
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${category?.color || '#71717A'}20` }}
          >
            <CategoryIcon size={20} color={category?.color || '#71717A'} />
          </View>
          
          <View className="flex-1">
            <Text className="text-white text-base font-medium" numberOfLines={1}>
              {description}
            </Text>
            <Text className="text-onyx-500 text-sm">
              {formatDate(item.date)}
            </Text>
          </View>
          
          <Text 
            className="text-base font-semibold"
            style={{ color: amountColor }}
          >
            {amountPrefix}{displayAmount(item.amount, privacyMode, currency, locale)}
          </Text>
        </View>
      </SwipeableTransactionRow>
    );
  };

  // Calculer les statistiques sur la liste filtrée
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type !== 'transfer' && t.type === 'income' && t.accountId === id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter((t) => t.type !== 'transfer' && t.type === 'expense' && t.accountId === id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses };
  }, [filteredTransactions, id]);

  const summaryNet = stats.income - stats.expenses;

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          {!searchVisible ? (
            <>
              <Text className="text-white text-xl font-bold flex-1">{account.name}</Text>
              <TouchableOpacity 
                onPress={() => setSearchVisible(true)}
                className="w-10 h-10 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <Icons.Search size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push(`/transaction/add?accountId=${id}`)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
              >
                <Icons.Plus size={24} color="#6366F1" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Description ou montant..."
                placeholderTextColor="#71717A"
                className="flex-1 bg-onyx-100 text-white px-4 py-2 rounded-xl mr-2"
                autoFocus
              />
              <TouchableOpacity 
                onPress={() => { setSearchQuery(''); setSearchVisible(false); }}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <Icons.X size={22} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View className="px-6 mb-6">
            <GlassCard variant="light">
              <View className="items-center py-4">
                <View 
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: `${account.color}20` }}
                >
                  <AccountIcon size={32} color={account.color} />
                </View>
                <Text className="text-onyx-500 text-sm mb-1">{accountType?.label || 'Compte'}</Text>
                <Text 
                  className="text-4xl font-bold"
                  style={{ color: account.balance >= 0 ? '#fff' : '#EF4444' }}
                >
                  {displayAmount(account.balance, privacyMode, currency, locale)}
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* Stats */}
          <View className="px-6 mb-6 flex-row" style={{ gap: 12 }}>
            <View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <View className="flex-row items-center mb-2">
                <Icons.TrendingUp size={16} color="#10B981" />
                <Text className="text-onyx-500 text-sm ml-2">Entrées</Text>
              </View>
              <Text className="text-accent-success text-lg font-semibold">
                {privacyMode ? displayAmount(stats.income, true, currency, locale) : `+${formatCurrency(stats.income)}`}
              </Text>
            </View>
            
            <View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <View className="flex-row items-center mb-2">
                <Icons.TrendingDown size={16} color="#EF4444" />
                <Text className="text-onyx-500 text-sm ml-2">Sorties</Text>
              </View>
              <Text className="text-accent-danger text-lg font-semibold">
                {privacyMode ? displayAmount(stats.expenses, true, currency, locale) : `-${formatCurrency(stats.expenses)}`}
              </Text>
            </View>
          </View>

          {/* Transactions */}
          <View className="px-6">
            <Text className="text-white text-lg font-semibold mb-4">Historique</Text>
            
            {filteredTransactions.length > 0 && (
              <View className="flex-row items-center justify-between mb-3 py-2 px-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Text className="text-onyx-500 text-sm">
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}  •{' '}
                  <Text className={summaryNet >= 0 ? 'text-accent-success' : 'text-accent-danger'}>
                    {summaryNet >= 0 ? '+' : ''}{displayAmount(summaryNet, privacyMode, currency, locale)}
                  </Text>
                </Text>
              </View>
            )}
            
            {filteredTransactions.length === 0 ? (
              <View className="items-center py-12">
                <Icons.Receipt size={48} color="#3F3F46" />
                <Text className="text-onyx-500 text-base mt-4 text-center">
                  {searchQuery.trim() ? 'Aucun résultat' : 'Aucune transaction'}
                </Text>
              </View>
            ) : (
              filteredTransactions.map((transaction) => (
                <View key={transaction.id}>
                  {renderTransaction({ item: transaction })}
                </View>
              ))
            )}
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
