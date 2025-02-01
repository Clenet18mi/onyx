// ============================================
// ONYX - Recent Transactions Component
// Liste des transactions récentes
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useTransactionStore, useAccountStore } from '@/stores';
import { formatCurrency, formatDate } from '@/utils/format';
import { CATEGORIES, Transaction } from '@/types';
import { GlassCard } from '../ui/GlassCard';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
}

function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const account = useAccountStore((state) => state.getAccount(transaction.accountId));
  const toAccount = transaction.toAccountId 
    ? useAccountStore((state) => state.getAccount(transaction.toAccountId))
    : null;
  
  const category = CATEGORIES.find((c) => c.id === transaction.category);
  const Icon = category ? (Icons as any)[category.icon] : Icons.CircleDot;
  
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const amountColor = isIncome ? '#10B981' : isTransfer ? '#6366F1' : '#EF4444';
  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-3"
    >
      <View 
        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
        style={{ backgroundColor: `${category?.color || '#71717A'}20` }}
      >
        <Icon size={22} color={category?.color || '#71717A'} />
      </View>
      
      <View className="flex-1">
        <Text className="text-white text-base font-medium" numberOfLines={1}>
          {transaction.description || category?.label || 'Transaction'}
        </Text>
        <Text className="text-onyx-500 text-sm">
          {isTransfer && toAccount
            ? `${account?.name} → ${toAccount.name}`
            : account?.name || 'Compte supprimé'
          }
        </Text>
      </View>
      
      <View className="items-end">
        <Text 
          className="text-base font-semibold"
          style={{ color: amountColor }}
        >
          {amountPrefix}{formatCurrency(transaction.amount)}
        </Text>
        <Text className="text-onyx-500 text-xs">
          {formatDate(transaction.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function RecentTransactions() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);
  
  // Prendre les 5 dernières transactions
  const recentTransactions = transactions.slice(0, 5);

  if (recentTransactions.length === 0) {
    return (
      <GlassCard>
        <Text className="text-white text-lg font-semibold mb-4">Transactions Récentes</Text>
        <View className="items-center py-8">
          <Icons.Receipt size={48} color="#3F3F46" />
          <Text className="text-onyx-500 text-base mt-4 text-center">
            Aucune transaction pour le moment
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/transaction/add')}
            className="mt-4 px-6 py-2 rounded-xl"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
          >
            <Text className="text-accent-primary font-medium">Ajouter une transaction</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard noPadding>
      <View className="p-4 pb-0">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white text-lg font-semibold">Transactions Récentes</Text>
          <TouchableOpacity 
            onPress={() => router.push('/transaction/add')}
            className="flex-row items-center"
          >
            <Icons.Plus size={16} color="#6366F1" />
            <Text className="text-accent-primary text-sm font-medium ml-1">Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="px-4">
        {recentTransactions.map((transaction, index) => (
          <View key={transaction.id}>
            <TransactionItem
              transaction={transaction}
              onPress={() => router.push(`/transaction/${transaction.id}`)}
            />
            {index < recentTransactions.length - 1 && (
              <View className="h-px bg-onyx-200/10" />
            )}
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        onPress={() => router.push('/accounts')}
        className="p-4 items-center border-t"
        style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}
      >
        <Text className="text-accent-primary font-medium">Voir toutes les transactions</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}
