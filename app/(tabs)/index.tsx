// ============================================
// ONYX - Dashboard Screen
// Premium minimal finance overview
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, Banknote, Eye, EyeOff, CalendarClock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSettingsStore, useAccountStore, usePlannedTransactionStore, useConfigStore } from '@/stores';
import { BalanceCard, QuickAccounts, QuickActions, QuickExpenses, PaydayModal, TransactionFeed, MonthlyRecapModal } from '@/components/dashboard';
import { PlannedTransactionCard } from '@/components/planned';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { GlassCard } from '@/components/ui/GlassCard';

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [paydayModalVisible, setPaydayModalVisible] = useState(false);
  const [bilanModalVisible, setBilanModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(-60)).current;

  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const lastBilanMonth = useSettingsStore((state) => state.lastBilanMonth);
  const lastPaydayModal = useSettingsStore((state) => state.lastPaydayModal);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const privacyMode = useSettingsStore((state) => state.privacyMode ?? false);
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const profile = useConfigStore((state) => state.profile);
  const overduePlanned = usePlannedTransactionStore((s) => s.getOverdue());
  const upcomingPlanned = usePlannedTransactionStore((s) => s.getUpcoming(7));

  useEffect(() => {
    const prevMonthKey = format(subMonths(new Date(), 1), 'yyyy-MM');
    if (lastBilanMonth !== prevMonthKey) setBilanModalVisible(true);
  }, [lastBilanMonth]);

  useEffect(() => {
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');
    const dayOfMonth = now.getDate();
    const isPayday = profile?.salaryDay != null && dayOfMonth === profile.salaryDay;
    if (isPayday && lastPaydayModal !== currentMonthKey) setPaydayModalVisible(true);
  }, [profile?.salaryDay, lastPaydayModal]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setToastVisible(true);
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(toastAnim, { toValue: -60, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
      }, 2000);
    }, 800);
  }, [toastAnim]);

  const handlePayday = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaydayModalVisible(true);
  };

  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
  const capitalizedDate = today.charAt(0).toUpperCase() + today.slice(1);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile?.name?.trim().split(/\s+/)[0] || '';
    if (!firstName) return 'Bonjour';
    if (hour >= 5 && hour < 12) return `Bonjour, ${firstName}`;
    if (hour >= 12 && hour < 18) return `Bon après-midi, ${firstName}`;
    if (hour >= 18 && hour < 22) return `Bonsoir, ${firstName}`;
    return `Bonne nuit, ${firstName}`;
  };

  if (accounts.length === 0) {
    return (
      <LinearGradient colors={theme.colors.gradients.card} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center px-6" edges={['top']}>
          <View className="w-24 h-24 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: 'rgba(109,124,255,0.20)', borderWidth: 1, borderColor: 'rgba(109,124,255,0.22)' }}>
            <Banknote size={48} color={theme.colors.accent.primary} />
          </View>
          <Text style={{ color: theme.colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Bienvenue sur ONYX</Text>
          <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 24 }}>Commencez par créer votre premier compte pour suivre vos finances.</Text>
          <TouchableOpacity onPress={() => router.push('/accounts')} className="px-8 py-4 rounded-2xl" style={{ backgroundColor: theme.colors.accent.primary, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', shadowColor: theme.colors.accent.primary, shadowOpacity: 0.22, shadowRadius: 12, elevation: 2 }}>
            <Text className="text-white font-semibold text-lg">Créer un compte</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ErrorBoundary>
          {toastVisible && (
            <Animated.View style={{ position: 'absolute', top: 0, left: 24, right: 24, zIndex: 1000, transform: [{ translateY: toastAnim }] }}>
              <View className="py-3 px-4 rounded-xl flex-row items-center justify-center" style={{ backgroundColor: theme.colors.background.card, borderWidth: 1, borderColor: theme.colors.background.tertiary }}>
                <Text style={{ color: theme.colors.text.primary, fontWeight: '600' }}>✓ Données mises à jour</Text>
              </View>
            </Animated.View>
          )}

          <View className="flex-row justify-between items-start px-6 py-4">
            <View className="flex-1 pr-3">
              <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>{capitalizedDate}</Text>
              <Text style={{ color: theme.colors.text.primary, fontSize: 26, fontWeight: '700', lineHeight: 32, marginTop: 4 }}>{getGreeting()}</Text>
              <Text style={{ color: theme.colors.text.secondary, fontSize: 13, marginTop: 4 }}>Votre suivi financier, simple et rapide.</Text>
            </View>

            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity onPress={() => { if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSettings({ privacyMode: !privacyMode }); }} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.background.card, borderWidth: 1, borderColor: theme.colors.background.tertiary }}>
                {privacyMode ? <EyeOff size={20} color={theme.colors.text.secondary} /> : <Eye size={20} color={theme.colors.text.secondary} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePayday} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(45, 212, 161, 0.12)', borderWidth: 1, borderColor: 'rgba(45, 212, 161, 0.22)' }}>
                <Banknote size={20} color={theme.colors.accent.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/settings')} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.background.card, borderWidth: 1, borderColor: theme.colors.background.tertiary }}>
                <Settings size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent.primary} colors={[theme.colors.accent.primary]} />}>
            <BalanceCard />
            <QuickActions onPayday={handlePayday} />
            <QuickExpenses />
            <QuickAccounts />

            {(overduePlanned.length > 0 || upcomingPlanned.length > 0) && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <CalendarClock size={22} color={theme.colors.accent.primary} />
                  <Text style={{ color: theme.colors.text.primary, fontSize: 18, fontWeight: '700', marginLeft: 8 }}>Transactions prévues</Text>
                </View>
                {overduePlanned.length > 0 && (
                  <View className="mb-4 p-3 rounded-2xl" style={{ backgroundColor: 'rgba(248, 113, 113, 0.08)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.22)' }}>
                    <Text style={{ color: theme.colors.accent.danger, fontWeight: '700', marginBottom: 8 }}>{overduePlanned.length} en retard</Text>
                    {overduePlanned.map((pt) => <PlannedTransactionCard key={pt.id} planned={pt} overdue />)}
                  </View>
                )}
                {upcomingPlanned.length > 0 && (
                  <View className="mb-4">
                    <Text style={{ color: theme.colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Prochains 7 jours</Text>
                    {upcomingPlanned.map((pt) => <PlannedTransactionCard key={pt.id} planned={pt} />)}
                  </View>
                )}
              </View>
            )}

            <TransactionFeed />
            <View className="h-24" />
          </ScrollView>
        </ErrorBoundary>

        <PaydayModal visible={paydayModalVisible} onClose={() => setPaydayModalVisible(false)} />
        <MonthlyRecapModal visible={bilanModalVisible} onClose={() => setBilanModalVisible(false)} />
      </SafeAreaView>
    </LinearGradient>
  );
}
