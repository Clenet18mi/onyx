// ============================================
// ONYX - Transaction Feed Component
// Flux complet des transactions avec filtres
// ============================================

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useTransactionStore, useAccountStore } from '@/stores';
import { formatCurrency, formatDate } from '@/utils/format';
import { CATEGORIES, Transaction } from '@/types';
import { GlassCard } from '../ui/GlassCard';
import { format, parseISO, isToday, isYesterday, isThisWeek, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const router = useRouter();
  const account = useAccountStore((state) => state.getAccount(transaction.accountId));
  const toAccount = transaction.toAccountId 
    ? useAccountStore((state) => state.getAccount(transaction.toAccountId))
    : null;
  
  const category = CATEGORIES.find((c) => c.id === transaction.category);
  const Icon = category ? (Icons as any)[category.icon] : Icons.CircleDot;
  
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  
  let amountColor = isIncome ? '#10B981' : '#EF4444';
  let amountPrefix = isIncome ? '+' : '-';
  
  if (isTransfer) {
    amountColor = '#6366F1';
    amountPrefix = '';
  }

  return (
    <TouchableOpacity
      onPress={() => {}}
      className="flex-row items-center py-3 px-4"
      activeOpacity={0.7}
    >
      <View 
        className="w-11 h-11 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${category?.color || '#71717A'}15` }}
      >
        <Icon size={20} color={category?.color || '#71717A'} />
      </View>
      
      <View className="flex-1">
        <Text className="text-white text-base font-medium" numberOfLines={1}>
          {transaction.description || category?.label || 'Transaction'}
        </Text>
        <Text className="text-onyx-500 text-sm" numberOfLines={1}>
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
          {format(parseISO(transaction.date), 'HH:mm', { locale: fr })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function TransactionFeed() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState(false);
  
  const transactions = useTransactionStore((state) => state.transactions);
  
  // Filtrer les transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    if (filter !== 'all') {
      filtered = filtered.filter((t) => t.type === filter);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filter]);

  // Grouper par date
  const sections = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    const displayTransactions = expanded 
      ? filteredTransactions 
      : filteredTransactions.slice(0, 10);
    
    displayTransactions.forEach((transaction) => {
      const date = parseISO(transaction.date);
      let sectionTitle: string;
      
      if (isToday(date)) {
        sectionTitle = "Aujourd'hui";
      } else if (isYesterday(date)) {
        sectionTitle = 'Hier';
      } else if (isThisWeek(date)) {
        sectionTitle = format(date, 'EEEE', { locale: fr });
        sectionTitle = sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1);
      } else {
        sectionTitle = format(date, 'd MMMM yyyy', { locale: fr });
      }
      
      if (!groups[sectionTitle]) {
        groups[sectionTitle] = [];
      }
      groups[sectionTitle].push(transaction);
    });
    
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
      total: data.reduce((sum, t) => {
        if (t.type === 'income') return sum + t.amount;
        if (t.type === 'expense') return sum - t.amount;
        return sum;
      }, 0),
    }));
  }, [filteredTransactions, expanded]);

  // Calculer les totaux
  const totals = useMemo(() => {
    return {
      income: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      transfer: transactions.filter(t => t.type === 'transfer').reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions]);

  const filters: { id: FilterType; label: string; icon: any; color: string }[] = [
    { id: 'all', label: 'Tout', icon: Icons.List, color: '#6366F1' },
    { id: 'income', label: 'Revenus', icon: Icons.TrendingUp, color: '#10B981' },
    { id: 'expense', label: 'Dépenses', icon: Icons.TrendingDown, color: '#EF4444' },
    { id: 'transfer', label: 'Virements', icon: Icons.ArrowLeftRight, color: '#8B5CF6' },
  ];

  if (transactions.length === 0) {
    return (
      <GlassCard className="mb-6">
        <View className="flex-row items-center mb-4">
          <Icons.Activity size={20} color="#6366F1" />
          <Text className="text-white text-lg font-semibold ml-2">Activité</Text>
        </View>
        
        <View className="items-center py-8">
          <Icons.Inbox size={48} color="#3F3F46" />
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
    <GlassCard noPadding className="mb-6">
      {/* Header avec filtres */}
      <View className="p-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Icons.Activity size={20} color="#6366F1" />
            <Text className="text-white text-lg font-semibold ml-2">Activité</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/transaction/add')}
            className="flex-row items-center"
          >
            <Icons.Plus size={16} color="#6366F1" />
            <Text className="text-accent-primary text-sm font-medium ml-1">Ajouter</Text>
          </TouchableOpacity>
        </View>
        
        {/* Filtres */}
        <View className="flex-row" style={{ gap: 8 }}>
          {filters.map((f) => {
            const isActive = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                className={`flex-row items-center px-3 py-2 rounded-xl`}
                style={{ 
                  backgroundColor: isActive ? `${f.color}20` : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <f.icon size={14} color={isActive ? f.color : '#71717A'} />
                <Text 
                  className={`ml-1.5 text-sm font-medium`}
                  style={{ color: isActive ? f.color : '#71717A' }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Liste des transactions */}
      {sections.map((section, sectionIndex) => (
        <View key={section.title}>
          {/* Section Header */}
          <View 
            className="flex-row justify-between items-center px-4 py-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            <Text className="text-onyx-500 text-sm font-medium">{section.title}</Text>
            <Text 
              className="text-sm font-semibold"
              style={{ color: section.total >= 0 ? '#10B981' : '#EF4444' }}
            >
              {section.total >= 0 ? '+' : ''}{formatCurrency(section.total)}
            </Text>
          </View>
          
          {/* Transactions */}
          {section.data.map((transaction, index) => (
            <View key={transaction.id}>
              <TransactionItem transaction={transaction} />
              {index < section.data.length - 1 && (
                <View className="h-px bg-onyx-200/5 mx-4" />
              )}
            </View>
          ))}
        </View>
      ))}

      {/* Voir plus / moins */}
      {filteredTransactions.length > 10 && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          className="p-4 items-center border-t flex-row justify-center"
          style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}
        >
          {expanded ? (
            <>
              <Icons.ChevronUp size={18} color="#6366F1" />
              <Text className="text-accent-primary font-medium ml-2">Voir moins</Text>
            </>
          ) : (
            <>
              <Icons.ChevronDown size={18} color="#6366F1" />
              <Text className="text-accent-primary font-medium ml-2">
                Voir tout ({filteredTransactions.length} transactions)
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </GlassCard>
  );
}
