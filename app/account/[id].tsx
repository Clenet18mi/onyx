// ============================================
// ONYX - Account Detail Screen
// Détail d'un compte avec transactions
// ============================================

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, useTransactionStore } from '@/stores';
import { formatCurrency, formatDate } from '@/utils/format';
import { CATEGORIES, Transaction, ACCOUNT_TYPES } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const account = useAccountStore((state) => state.getAccount(id || ''));
  const getTransactionsByAccount = useTransactionStore((state) => state.getTransactionsByAccount);
  
  const transactions = useMemo(() => {
    if (!id) return [];
    return getTransactionsByAccount(id).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [id, getTransactionsByAccount]);

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
    const category = CATEGORIES.find((c) => c.id === item.category);
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

    return (
      <View className="flex-row items-center py-3 border-b border-onyx-200/10">
        <View 
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${category?.color || '#71717A'}20` }}
        >
          <CategoryIcon size={20} color={category?.color || '#71717A'} />
        </View>
        
        <View className="flex-1">
          <Text className="text-white text-base font-medium" numberOfLines={1}>
            {item.description || category?.label || 'Transaction'}
          </Text>
          <Text className="text-onyx-500 text-sm">
            {formatDate(item.date)}
          </Text>
        </View>
        
        <Text 
          className="text-base font-semibold"
          style={{ color: amountColor }}
        >
          {amountPrefix}{formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  // Calculer les statistiques
  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income' && t.accountId === id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter((t) => t.type === 'expense' && t.accountId === id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses };
  }, [transactions, id]);

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
          <Text className="text-white text-xl font-bold flex-1">{account.name}</Text>
          <TouchableOpacity 
            onPress={() => router.push(`/transaction/add?accountId=${id}`)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
          >
            <Icons.Plus size={24} color="#6366F1" />
          </TouchableOpacity>
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
                  {formatCurrency(account.balance)}
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
                +{formatCurrency(stats.income)}
              </Text>
            </View>
            
            <View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <View className="flex-row items-center mb-2">
                <Icons.TrendingDown size={16} color="#EF4444" />
                <Text className="text-onyx-500 text-sm ml-2">Sorties</Text>
              </View>
              <Text className="text-accent-danger text-lg font-semibold">
                -{formatCurrency(stats.expenses)}
              </Text>
            </View>
          </View>

          {/* Transactions */}
          <View className="px-6">
            <Text className="text-white text-lg font-semibold mb-4">Historique</Text>
            
            {transactions.length === 0 ? (
              <View className="items-center py-12">
                <Icons.Receipt size={48} color="#3F3F46" />
                <Text className="text-onyx-500 text-base mt-4 text-center">
                  Aucune transaction
                </Text>
              </View>
            ) : (
              transactions.map((transaction) => (
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
