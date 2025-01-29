// ============================================
// ONYX - Quick Accounts Component
// Aperçu rapide des comptes
// ============================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import { useAccountStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { ACCOUNT_TYPES } from '@/types';

export function QuickAccounts() {
  const router = useRouter();
  const accounts = useAccountStore((state) => state.getActiveAccounts());

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Wallet;
  };

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4 px-1">
        <Text className="text-white text-lg font-semibold">Mes Comptes</Text>
        <TouchableOpacity 
          onPress={() => router.push('/accounts')}
          className="flex-row items-center"
        >
          <Text className="text-accent-primary text-sm font-medium">Voir tout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {accounts.map((account) => {
          const Icon = getIcon(account.icon);
          return (
            <TouchableOpacity
              key={account.id}
              onPress={() => router.push(`/account/${account.id}`)}
              className="mr-3 p-4 rounded-2xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                minWidth: 160,
              }}
            >
              <View 
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: `${account.color}20` }}
              >
                <Icon size={20} color={account.color} />
              </View>
              
              <Text className="text-onyx-500 text-sm mb-1" numberOfLines={1}>
                {account.name}
              </Text>
              <Text className="text-white text-lg font-semibold">
                {formatCurrency(account.balance, account.currency)}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {/* Bouton Ajouter */}
        <TouchableOpacity
          onPress={() => router.push('/accounts')}
          className="mr-3 p-4 rounded-2xl items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderStyle: 'dashed',
            minWidth: 100,
          }}
        >
          <View 
            className="w-10 h-10 rounded-xl items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
          >
            <Plus size={20} color="#6366F1" />
          </View>
          <Text className="text-onyx-500 text-sm">Ajouter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
