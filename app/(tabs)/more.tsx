// ============================================
// ONYX - More Screen
// Menu : abonnements, outils, paramètres (export/import dans Gestion des données)
// ============================================

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Icons from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSubscriptionStore, useAccountStore, useTransactionStore, useAuthStore, useSettingsStore, useGamificationStore } from '@/stores';
import { formatCurrency, formatDate, displayAmount, safeParseISO } from '@/utils/format';
import { Subscription, CATEGORIES, AVAILABLE_COLORS, RecurrenceFrequency } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { addMonths, startOfDay, differenceInDays, isToday, endOfMonth, startOfMonth, isWithinInterval } from 'date-fns';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SUBSCRIPTION_ICONS = [
  'Tv', 'Music', 'Film', 'Gamepad2', 'Cloud', 'Newspaper',
  'Dumbbell', 'Wifi', 'Phone', 'Mail', 'ShieldCheck', 'Sparkles',
];

export default function MoreScreen() {
  const router = useRouter();
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState<Date>(() => addMonths(startOfDay(new Date()), 1));
  const [showBillingDatePicker, setShowBillingDatePicker] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [icon, setIcon] = useState('Tv');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  
  const { 
    subscriptions, 
    addSubscription, 
    updateSubscription, 
    deleteSubscription,
    toggleSubscription,
    getTotalMonthlySubscriptions,
    getTotalYearlySubscriptions,
    getSubscriptionsThisMonth,
  } = useSubscriptionStore();
  
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const transactions = useTransactionStore((state) => state.transactions);
  const { lock, biometricEnabled, enableBiometric } = useAuthStore();
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const toggleHaptic = useSettingsStore((state) => state.toggleHaptic);
  const privacyMode = useSettingsStore((state) => state.privacyMode ?? false);
  const currency = useSettingsStore((state) => state.currency);
  const locale = useSettingsStore((state) => state.locale);
  
  const monthlyTotal = getTotalMonthlySubscriptions();
  const yearlyTotal = getTotalYearlySubscriptions();
  const subscriptionsThisMonth = getSubscriptionsThisMonth();
  const { streak, levelData, updateStreak } = useGamificationStore();
  React.useEffect(() => { updateStreak(); }, [transactions.length, updateStreak]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setFrequency('monthly');
    setNextBillingDate(addMonths(startOfDay(new Date()), 1));
    setAccountId(accounts[0]?.id || '');
    setIcon('Tv');
    setColor(AVAILABLE_COLORS[0]);
    setEditingSubscription(null);
  };

  const openAddModal = () => {
    resetForm();
    setSubscriptionModalVisible(true);
  };

  const openEditModal = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setName(subscription.name);
    setAmount(subscription.amount.toString());
    setFrequency(subscription.frequency);
    setNextBillingDate(safeParseISO(subscription.nextBillingDate) ?? addMonths(startOfDay(new Date()), 1));
    setAccountId(subscription.accountId);
    setIcon(subscription.icon);
    setColor(subscription.color);
    setSubscriptionModalVisible(true);
  };

  const handleSaveSubscription = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
      return;
    }

    const subscriptionData = {
      name: name.trim(),
      amount: parseFloat(amount),
      category: 'subscriptions' as const,
      accountId,
      frequency,
      nextBillingDate: startOfDay(nextBillingDate).toISOString(),
      icon,
      color,
      isActive: true,
    };

    if (editingSubscription) {
      updateSubscription(editingSubscription.id, subscriptionData);
    } else {
      addSubscription(subscriptionData);
    }

    setSubscriptionModalVisible(false);
    resetForm();
  };

  const handleDeleteSubscription = () => {
    if (editingSubscription) {
      const freqLabel = editingSubscription.frequency === 'monthly' ? 'mois' : editingSubscription.frequency === 'yearly' ? 'an' : editingSubscription.frequency === 'weekly' ? 'semaine' : 'jour';
      Alert.alert(
        'Supprimer l\'abonnement',
        `Supprimer l'abonnement ${editingSubscription.name} (${displayAmount(editingSubscription.amount, privacyMode, currency, locale)}/${freqLabel}) ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              deleteSubscription(editingSubscription.id);
              setSubscriptionModalVisible(false);
              resetForm();
            },
          },
        ]
      );
    }
  };

  const handleLock = () => {
    Alert.alert(
      'Verrouiller ONYX',
      'Voulez-vous verrouiller l\'application ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Verrouiller', onPress: () => lock() },
      ]
    );
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.CreditCard;
  };

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-white text-2xl font-bold">Plus</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Abonnements Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">Abonnements</Text>
              {accounts.length > 0 ? (
                <TouchableOpacity onPress={openAddModal}>
                  <Icons.Plus size={24} color="#6366F1" />
                </TouchableOpacity>
              ) : (
                <Text className="text-onyx-500 text-sm">Créez un compte d'abord</Text>
              )}
            </View>
            
            {accounts.length === 0 && (
              <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                <Text className="text-amber-400 text-sm">Créez au moins un compte (onglet Comptes) pour ajouter des abonnements.</Text>
              </View>
            )}
            
            {/* Résumé */}
            <GlassCard variant="light" className="mb-4">
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
                >
                  <Icons.CreditCard size={24} color="#8B5CF6" />
                </View>
                <View>
                  <Text className="text-onyx-500 text-sm">Coût mensuel</Text>
                  <Text className="text-white text-2xl font-bold">
                    {displayAmount(monthlyTotal, privacyMode, currency, locale)}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Ce mois-ci : abonnements triés par nextBillingDate */}
            {subscriptionsThisMonth.length > 0 && (
              <View className="mb-4">
                <Text className="text-white font-semibold mb-3">Ce mois-ci</Text>
                <GlassCard variant="light" noPadding>
                  {subscriptionsThisMonth.map((sub) => {
                    const SubIcon = getIcon(sub.icon);
                    const account = accounts.find((a) => a.id === sub.accountId);
                    const AccountIcon = account ? getIcon(account.icon) : Icons.Wallet;
                    const billingDate = safeParseISO(sub.nextBillingDate);
                    if (!billingDate) return null;
                    const today = startOfDay(new Date());
                    const days = differenceInDays(billingDate, today);
                    let daysLabel = '';
                    if (isToday(billingDate)) daysLabel = "aujourd'hui ⚠️";
                    else if (days === 1) daysLabel = 'demain';
                    else daysLabel = `dans ${days} jours`;
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        onPress={() => openEditModal(sub)}
                        className="flex-row items-center justify-between px-4 py-3 border-b border-onyx-200/10 last:border-b-0"
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${sub.color}20` }}>
                            <SubIcon size={20} color={sub.color} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-medium">{sub.name}</Text>
                            <View className="flex-row items-center mt-0.5">
                              <AccountIcon size={14} color="#71717A" />
                              <Text className="text-onyx-500 text-xs ml-1">{account?.name ?? '—'}</Text>
                            </View>
                          </View>
                        </View>
                        <View className="items-end mr-2">
                          <Text className="text-accent-danger font-semibold">{displayAmount(sub.amount, privacyMode, currency, locale)}</Text>
                          <Text className="text-onyx-500 text-xs">{daysLabel}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <View className="px-4 py-3 border-t border-onyx-200/10">
                    <Text className="text-onyx-500 text-sm">
                      Total abonnements : {displayAmount(monthlyTotal, privacyMode, currency, locale)}/mois
                    </Text>
                  </View>
                </GlassCard>
              </View>
            )}

            {subscriptions.filter((s) => s.isActive).length > 0 && (
              <View className="mb-4 px-1">
                <Text className="text-onyx-500 text-sm">
                  📊 Coût annuel de vos abonnements : {displayAmount(yearlyTotal, privacyMode, currency, locale)}
                </Text>
              </View>
            )}

            {/* Liste des abonnements */}
            {subscriptions.length === 0 ? (
              <TouchableOpacity
                onPress={accounts.length > 0 ? openAddModal : undefined}
                disabled={accounts.length === 0}
                className="p-4 rounded-2xl items-center"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderStyle: 'dashed',
                  opacity: accounts.length === 0 ? 0.6 : 1,
                }}
              >
                <Text className="text-onyx-500">
                  {accounts.length === 0 ? 'Créez d\'abord un compte' : 'Ajouter votre premier abonnement'}
                </Text>
              </TouchableOpacity>
            ) : (
              subscriptions.map((sub) => {
                const SubIcon = getIcon(sub.icon);
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => openEditModal(sub)}
                    className="mb-2"
                  >
                    <GlassCard>
                      <View className="flex-row items-center">
                        <View 
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: `${sub.color}20` }}
                        >
                          <SubIcon size={20} color={sub.color} />
                        </View>
                        
                        <View className="flex-1">
                          <Text className="text-white font-medium">{sub.name}</Text>
                          <Text className="text-onyx-500 text-sm">
                            {formatDate(sub.nextBillingDate)}
                          </Text>
                        </View>
                        
                        <View className="items-end mr-3">
                          <Text className="text-white font-semibold">
                            {displayAmount(sub.amount, privacyMode, currency, locale)}
                          </Text>
                          <Text className="text-onyx-500 text-xs">
                            /{sub.frequency === 'monthly' ? 'mois' : 
                              sub.frequency === 'yearly' ? 'an' : 
                              sub.frequency === 'weekly' ? 'sem' : 'jour'}
                          </Text>
                        </View>
                        
                        <Switch
                          value={sub.isActive}
                          onValueChange={() => toggleSubscription(sub.id)}
                          trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                          thumbColor="#fff"
                        />
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Raccourcis / Outils */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Outils</Text>
            <GlassCard noPadding>
              <TouchableOpacity
                onPress={() => router.push('/period-comparator')}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.GitCompare size={20} color="#6366F1" />
                  <View className="ml-3">
                    <Text className="text-white">Comparer périodes</Text>
                    <Text className="text-onyx-500 text-sm">Mois A vs mois B</Text>
                  </View>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/scenarios')}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.LineChart size={20} color="#10B981" />
                  <View className="ml-3">
                    <Text className="text-white">Scénarios</Text>
                    <Text className="text-onyx-500 text-sm">Et si… projection de solde</Text>
                  </View>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/transaction/add')}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center">
                  <Icons.PlusCircle size={20} color="#F59E0B" />
                  <View className="ml-3">
                    <Text className="text-white">Nouvelle transaction</Text>
                    <Text className="text-onyx-500 text-sm">Dépense ou revenu</Text>
                  </View>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* Réalisations (gamification) */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Réalisations</Text>
            <GlassCard className="mb-4">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-onyx-500 text-sm">Série</Text>
                  <Text className="text-white text-xl font-bold">🔥 {streak.currentStreak} jour{streak.currentStreak !== 1 ? 's' : ''}</Text>
                  <Text className="text-onyx-500 text-xs">Record: {streak.longestStreak} jours</Text>
                </View>
                <View className="items-end">
                  <Text className="text-onyx-500 text-sm">Niveau</Text>
                  <Text className="text-white text-xl font-bold">Niv. {levelData.level}</Text>
                  <Text className="text-onyx-500 text-xs">{levelData.currentXp} / {levelData.xpForNextLevel} XP</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Paramètres Section */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Paramètres</Text>
            
            <GlassCard noPadding>
              <TouchableOpacity
                onPress={toggleHaptic}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.Vibrate size={20} color="#71717A" />
                  <Text className="text-white ml-3">Retour haptique</Text>
                </View>
                <Switch
                  value={hapticEnabled}
                  onValueChange={toggleHaptic}
                  trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => enableBiometric(!biometricEnabled)}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.Fingerprint size={20} color="#71717A" />
                  <Text className="text-white ml-3">Biométrie</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={(v) => enableBiometric(v)}
                  trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.Settings size={20} color="#71717A" />
                  <Text className="text-white ml-3">Tous les paramètres</Text>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleLock}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center">
                  <Icons.Lock size={20} color="#71717A" />
                  <Text className="text-white ml-3">Verrouiller</Text>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* À propos */}
          <View className="mb-6 items-center py-8">
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
            >
              <Icons.Shield size={32} color="#6366F1" />
            </View>
            <Text className="text-white text-xl font-bold">ONYX</Text>
            <Text className="text-onyx-500 text-sm">Version 1.0.0</Text>
            <Text className="text-onyx-500 text-sm mt-2">100% Offline · Vos données restent privées</Text>
          </View>

          <View className="h-24" />
        </ScrollView>

        {/* Modal Abonnement */}
        <Modal
          visible={subscriptionModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSubscriptionModalVisible(false)}
        >
          <View className="flex-1 bg-onyx">
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-onyx-200/10">
                <TouchableOpacity onPress={() => setSubscriptionModalVisible(false)}>
                  <Text className="text-onyx-500 text-base">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">
                  {editingSubscription ? 'Modifier' : 'Nouvel Abonnement'}
                </Text>
                <TouchableOpacity onPress={handleSaveSubscription}>
                  <Text className="text-accent-primary text-base font-semibold">Enregistrer</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                {/* Nom */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Nom</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Netflix, Spotify..."
                    placeholderTextColor="#52525B"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Montant */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Montant (€)</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Ex: 12.99"
                    placeholderTextColor="#52525B"
                    keyboardType="decimal-pad"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Fréquence */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Fréquence</Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {[
                      { id: 'weekly', label: 'Semaine' },
                      { id: 'monthly', label: 'Mois' },
                      { id: 'yearly', label: 'Année' },
                    ].map((f) => (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => setFrequency(f.id as any)}
                        className={`flex-1 py-3 rounded-xl ${
                          frequency === f.id ? 'bg-accent-primary' : 'bg-onyx-100'
                        }`}
                      >
                        <Text 
                          className={`text-center font-medium ${
                            frequency === f.id ? 'text-white' : 'text-onyx-500'
                          }`}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Date de prélèvement */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Date de prélèvement</Text>
                  <TouchableOpacity
                    onPress={() => setShowBillingDatePicker(true)}
                    className="flex-row items-center bg-onyx-100 px-4 py-3 rounded-xl"
                  >
                    <Icons.Calendar size={20} color="#71717A" />
                    <Text className="text-white ml-3 text-base">
                      {format(nextBillingDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </Text>
                  </TouchableOpacity>
                  {showBillingDatePicker && (
                    <>
                      {Platform.OS === 'ios' && (
                        <View className="mt-2 flex-row justify-end gap-2">
                          <TouchableOpacity onPress={() => setShowBillingDatePicker(false)} className="py-2 px-4">
                            <Text className="text-onyx-500">Annuler</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setShowBillingDatePicker(false);
                            }}
                            className="py-2 px-4"
                          >
                            <Text className="text-accent-primary font-semibold">OK</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <DateTimePicker
                        value={nextBillingDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_event, selected) => {
                          if (Platform.OS === 'android') setShowBillingDatePicker(false);
                          if (selected) setNextBillingDate(startOfDay(selected));
                        }}
                        locale="fr-FR"
                      />
                    </>
                  )}
                </View>

                {/* Compte */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Compte de prélèvement</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 8 }}>
                      {accounts.map((account) => {
                        const AccountIcon = getIcon(account.icon);
                        const isSelected = accountId === account.id;
                        return (
                          <TouchableOpacity
                            key={account.id}
                            onPress={() => setAccountId(account.id)}
                            className={`px-4 py-3 rounded-xl flex-row items-center ${
                              isSelected ? 'border' : ''
                            }`}
                            style={{ 
                              backgroundColor: isSelected ? `${account.color}20` : 'rgba(255, 255, 255, 0.08)',
                              borderColor: isSelected ? account.color : 'transparent',
                            }}
                          >
                            <AccountIcon size={18} color={isSelected ? account.color : '#71717A'} />
                            <Text 
                              className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-onyx-500'}`}
                            >
                              {account.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Icône */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Icône</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                    {SUBSCRIPTION_ICONS.map((iconName) => {
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

                {/* Bouton Supprimer */}
                {editingSubscription && (
                  <Button
                    title="Supprimer cet abonnement"
                    variant="danger"
                    fullWidth
                    onPress={handleDeleteSubscription}
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
