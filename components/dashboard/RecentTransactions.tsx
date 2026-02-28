// ============================================
// ONYX - Recent Transactions Component
// Liste des transactions récentes
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useTransactionStore, useAccountStore, useConfigStore, useSettingsStore } from '@/stores';
import { formatCurrency, formatDate } from '@/utils/format';
import { Transaction } from '@/types';
import { GlassCard } from '../ui/GlassCard';
import { SwipeableTransactionRow } from '../ui/SwipeableTransactionRow';

function TransactionRowContent({ transaction }: { transaction: Transaction }) {
  const account = useAccountStore((state) => state.getAccount(transaction.accountId));
  const toAccount = transaction.toAccountId 
    ? useAccountStore((state) => state.getAccount(transaction.toAccountId))
    : null;
  const category = useConfigStore((s) => s.getCategoryById(transaction.category));
  const Icon = category ? (Icons as any)[category.icon] : Icons.CircleDot;
  
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const amountColor = isIncome ? '#10B981' : isTransfer ? '#6366F1' : '#EF4444';
  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';

  return (
    <View className="flex-row items-center py-3">
      <View 
        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
        style={{ backgroundColor: `${category?.color || '#71717A'}20` }}
      >
        <Icon size={22} color={category?.color || '#71717A'} />
      </View>
      
      <View className="flex-1">
        <Text className="text-white text-base font-medium" numberOfLines={1}>
          {transaction.description || category?.label || transaction.category || 'Transaction'}
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
    </View>
  );
}

export function RecentTransactions() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const getCategoryById = useConfigStore((s) => s.getCategoryById);
  
  // Prendre les 5 dernières transactions (tri par date décroissante)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
        {recentTransactions.map((transaction, index) => {
          const category = getCategoryById(transaction.category);
          const desc = transaction.description || category?.label || transaction.category || 'Transaction';
          const prefix = transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '' : '-';
          const deleteLabel = `Supprimer « ${desc} » (${prefix}${formatCurrency(transaction.amount)}) ?`;
          return (
            <View key={transaction.id}>
              <SwipeableTransactionRow
                onPress={() => router.push(`/transaction/${transaction.id}`)}
                onDelete={() => deleteTransaction(transaction.id)}
                deleteLabel={deleteLabel}
                hapticEnabled={hapticEnabled}
              >
                <TransactionRowContent transaction={transaction} />
              </SwipeableTransactionRow>
              {index < recentTransactions.length - 1 && (
                <View className="h-px bg-onyx-200/10" />
              )}
            </View>
          );
        })}
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
