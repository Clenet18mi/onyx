// ============================================
// ONYX - More Screen
// Menu avec abonnements, export PDF, paramètres
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useSubscriptionStore, useAccountStore, useTransactionStore, useAuthStore, useSettingsStore, useGamificationStore } from '@/stores';
import { formatCurrency, formatDate } from '@/utils/format';
import { exportToPDF, exportToCSV, exportToJSON } from '@/utils/pdfExport';
import { Subscription, CATEGORIES, AVAILABLE_COLORS, RecurrenceFrequency } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { addMonths, subMonths, format, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const SUBSCRIPTION_ICONS = [
  'Tv', 'Music', 'Film', 'Gamepad2', 'Cloud', 'Newspaper',
  'Dumbbell', 'Wifi', 'Phone', 'Mail', 'ShieldCheck', 'Sparkles',
];

export default function MoreScreen() {
  const router = useRouter();
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
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
  } = useSubscriptionStore();
  
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  const transactions = useTransactionStore((state) => state.transactions);
  const { lock, biometricEnabled, enableBiometric } = useAuthStore();
  const { hapticEnabled, toggleHaptic } = useSettingsStore();
  
  const monthlyTotal = getTotalMonthlySubscriptions();
  const { streak, levelData, updateStreak } = useGamificationStore();
  React.useEffect(() => { updateStreak(); }, [transactions.length, updateStreak]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setFrequency('monthly');
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
      nextBillingDate: addMonths(new Date(), 1).toISOString(),
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
      Alert.alert(
        'Supprimer l\'abonnement',
        'Voulez-vous vraiment supprimer cet abonnement ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deleteSubscription(editingSubscription.id);
              setSubscriptionModalVisible(false);
              resetForm();
            },
          },
        ]
      );
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(transactions, accounts, selectedMonth);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le relevé');
      console.error(error);
    } finally {
      setIsExporting(false);
      setExportModalVisible(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportToCSV(transactions, accounts);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
      console.error(error);
    } finally {
      setIsExporting(false);
      setExportModalVisible(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      await exportToJSON(transactions, accounts);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter en JSON');
      console.error(error);
    } finally {
      setIsExporting(false);
      setExportModalVisible(false);
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

  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: fr });
  const monthLabelCapitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

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
              <TouchableOpacity onPress={openAddModal}>
                <Icons.Plus size={24} color="#6366F1" />
              </TouchableOpacity>
            </View>
            
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
                    {formatCurrency(monthlyTotal)}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Liste des abonnements */}
            {subscriptions.length === 0 ? (
              <TouchableOpacity
                onPress={openAddModal}
                className="p-4 rounded-2xl items-center"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderStyle: 'dashed',
                }}
              >
                <Text className="text-onyx-500">Ajouter votre premier abonnement</Text>
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
                            {formatCurrency(sub.amount)}
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

          {/* Export Section */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Exporter</Text>
            <GlassCard noPadding>
              <TouchableOpacity
                onPress={() => setExportModalVisible(true)}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.FileText size={20} color="#6366F1" />
                  <View className="ml-3">
                    <Text className="text-white">Relevé PDF</Text>
                    <Text className="text-onyx-500 text-sm">Beau relevé mensuel</Text>
                  </View>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleExportCSV}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.Table size={20} color="#10B981" />
                  <View className="ml-3">
                    <Text className="text-white">Export CSV</Text>
                    <Text className="text-onyx-500 text-sm">Toutes les données</Text>
                  </View>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExportJSON}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center">
                  <Icons.Braces size={20} color="#F59E0B" />
                  <View className="ml-3">
                    <Text className="text-white">Export JSON</Text>
                    <Text className="text-onyx-500 text-sm">Données structurées</Text>
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

        {/* Modal Export PDF */}
        <Modal
          visible={exportModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setExportModalVisible(false)}
        >
          <View className="flex-1 bg-onyx">
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-onyx-200/10">
                <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                  <Text className="text-onyx-500 text-base">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">Relevé PDF</Text>
                <View style={{ width: 60 }} />
              </View>

              <View className="flex-1 px-6 py-6">
                <GlassCard variant="light" className="items-center py-8 mb-6">
                  <Icons.FileText size={64} color="#6366F1" />
                  <Text className="text-white text-xl font-bold mt-4">Relevé Mensuel</Text>
                  <Text className="text-onyx-500 text-center mt-2">
                    Générez un beau relevé PDF avec toutes vos transactions du mois sélectionné
                  </Text>
                </GlassCard>

                {/* Sélecteur de mois */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-3">Sélectionner le mois</Text>
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                      onPress={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <Icons.ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <View className="flex-1 mx-4">
                      <Text className="text-white text-xl font-bold text-center">
                        {monthLabelCapitalized}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => {
                        const nextMonth = addMonths(selectedMonth, 1);
                        if (nextMonth <= new Date()) {
                          setSelectedMonth(nextMonth);
                        }
                      }}
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <Icons.ChevronRight size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Aperçu */}
                <GlassCard className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Le relevé inclura:</Text>
                  <View style={{ gap: 8 }}>
                    <View className="flex-row items-center">
                      <Icons.Check size={16} color="#10B981" />
                      <Text className="text-white ml-2">Résumé revenus / dépenses</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Icons.Check size={16} color="#10B981" />
                      <Text className="text-white ml-2">Répartition par catégorie</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Icons.Check size={16} color="#10B981" />
                      <Text className="text-white ml-2">Toutes les transactions détaillées</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Icons.Check size={16} color="#10B981" />
                      <Text className="text-white ml-2">Design élégant et professionnel</Text>
                    </View>
                  </View>
                </GlassCard>

                <Button
                  title={isExporting ? 'Génération en cours...' : 'Générer le relevé PDF'}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isExporting}
                  onPress={handleExportPDF}
                  icon={<Icons.Download size={20} color="white" />}
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
