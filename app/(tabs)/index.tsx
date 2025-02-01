// ============================================
// ONYX - Dashboard Screen
// Écran principal avec vue d'ensemble complète
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, Bell, Banknote } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSubscriptionStore, useSettingsStore, useAccountStore } from '@/stores';
import { 
  BalanceCard, 
  CashflowChart, 
  QuickAccounts, 
  QuickActions,
  QuickExpenses,
  PaydayModal,
  TransactionFeed,
  SmartInsights,
} from '@/components/dashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [paydayModalVisible, setPaydayModalVisible] = useState(false);
  
  const processSubscriptions = useSubscriptionStore((state) => state.processSubscriptions);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    processSubscriptions();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handlePayday = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPaydayModalVisible(true);
  };

  const today = format(new Date(), 'EEEE d MMMM', { locale: fr });
  const capitalizedDay = today.charAt(0).toUpperCase() + today.slice(1);
  
  // Message de salutation selon l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // État vide - pas de comptes
  if (accounts.length === 0) {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 justify-center items-center px-6" edges={['top']}>
          <View 
            className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
          >
            <Banknote size={48} color="#6366F1" />
          </View>
          <Text className="text-white text-2xl font-bold mb-2">Bienvenue sur ONYX</Text>
          <Text className="text-onyx-500 text-center mb-8">
            Commencez par créer votre premier compte pour suivre vos finances
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/accounts')}
            className="px-8 py-4 rounded-2xl"
            style={{ backgroundColor: '#6366F1' }}
          >
            <Text className="text-white font-semibold text-lg">Créer un compte</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <View>
            <Text className="text-onyx-500 text-sm">{capitalizedDay}</Text>
            <Text className="text-white text-2xl font-bold">{getGreeting()} 👋</Text>
          </View>
          
          <View className="flex-row" style={{ gap: 12 }}>
            {/* Bouton Payday */}
            <TouchableOpacity
              onPress={handlePayday}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
            >
              <Banknote size={20} color="#10B981" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {}}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Bell size={20} color="#71717A" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Settings size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
        >
          {/* Balance Card */}
          <BalanceCard />
          
          {/* Quick Actions */}
          <QuickActions onPayday={handlePayday} />
          
          {/* Quick Expenses */}
          <QuickExpenses />
          
          {/* Quick Accounts */}
          <QuickAccounts />
          
          {/* Smart Insights */}
          <SmartInsights />
          
          {/* Cashflow Chart */}
          <CashflowChart />
          
          {/* Transaction Feed */}
          <TransactionFeed />
          
          {/* Bottom spacing */}
          <View className="h-24" />
        </ScrollView>
        
        {/* Payday Modal */}
        <PaydayModal 
          visible={paydayModalVisible}
          onClose={() => setPaydayModalVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
