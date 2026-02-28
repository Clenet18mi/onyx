// ============================================
// ONYX - Add Transaction Screen
// Écran d'ajout de transaction — layout calculatrice
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Icons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAccountStore, useTransactionStore, useSettingsStore, usePlannedTransactionStore, useConfigStore, useAutomationStore, useBudgetStore } from '@/stores';
import { TransactionCategory, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/format';
import { findSimilarTransactions, getDuplicateIgnoreSignature } from '@/utils/duplicateDetector';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { DuplicateAlertModal, ReceiptScanner, VoiceNote } from '@/components/transactions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string; category?: string; type?: string; amount?: string; description?: string; prefill?: string }>();
  
  const [type, setType] = useState<TransactionType>((params.type as TransactionType) || 'expense');
  const [amount, setAmount] = useState(params.amount ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [category, setCategory] = useState<TransactionCategory>((params.category as TransactionCategory) || 'other');
  const [accountId, setAccountId] = useState(params.accountId || '');
  const [isDuplicatePrefill, setIsDuplicatePrefill] = useState(false);
  
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const transactions = useTransactionStore((state) => state.transactions);
  const lastTransaction = useTransactionStore((state) => state.lastTransaction);
  const addPlannedTransaction = usePlannedTransactionStore((state) => state.addPlannedTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const duplicateAlertEnabled = useSettingsStore((state) => state.duplicateAlertEnabled ?? true);
  const ignoredDuplicateSignatures = useSettingsStore((state) => state.ignoredDuplicateSignatures ?? []);
  const addIgnoredDuplicateSignature = useSettingsStore((state) => state.addIgnoredDuplicateSignature);
  const lastUsedAccountId = useSettingsStore((state) => state.lastUsedAccountId);
  const getVisibleCategories = useConfigStore((state) => state.getVisibleCategories);
  const rules = useAutomationStore((state) => state.rules);
  const getBudgetByCategory = useBudgetStore((state) => state.getBudgetByCategory);
  const getBudgetProgress = useBudgetStore((state) => state.getBudgetProgress);
  const getCategoryById = useConfigStore((state) => state.getCategoryById);

  const [autoApplied, setAutoApplied] = useState(false);
  const [isPlanned, setIsPlanned] = useState(false);
  const [plannedDate, setPlannedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [pendingDuplicateMatches, setPendingDuplicateMatches] = useState<ReturnType<typeof findSimilarTransactions>>([]);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const amountInputRef = React.useRef<TextInput>(null);
  const prefillAccountAppliedRef = React.useRef(false);
  const wasOverBudgetRef = React.useRef(false);
  const [voiceNoteUri, setVoiceNoteUri] = useState<string | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [voiceNoteModalVisible, setVoiceNoteModalVisible] = useState(false);
  const pillIndex = useSharedValue(type === 'expense' ? 0 : type === 'income' ? 1 : 2);
  const { width: windowWidth } = useWindowDimensions();
  const pillContainerWidth = windowWidth - 48; // px-6 = 24*2

  // Sélectionner le premier compte si aucun n'est sélectionné ; appliquer params template ; pré-remplir compte depuis prefill quand les comptes sont chargés
  React.useEffect(() => {
    if (!accounts.length) return;
    if (params.accountId && accounts.some((a) => a.id === params.accountId)) {
      setAccountId(params.accountId);
      return;
    }
    setAccountId((current) => {
      if (current && accounts.some((a) => a.id === current)) return current;
      return lastUsedAccountId && accounts.some((a) => a.id === lastUsedAccountId)
        ? lastUsedAccountId
        : accounts[0].id;
    });
  }, [accounts, params.accountId, lastUsedAccountId]);
  React.useEffect(() => {
    if (params.prefill && accounts.length > 0 && !prefillAccountAppliedRef.current) {
      try {
        const p = JSON.parse(params.prefill) as { accountId?: string };
        if (p.accountId && accounts.some((a) => a.id === p.accountId)) {
          setAccountId(p.accountId);
          prefillAccountAppliedRef.current = true;
        }
      } catch (_) {}
    }
  }, [accounts, params.prefill]);
  React.useEffect(() => {
    if (params.category) setCategory(params.category as TransactionCategory);
    if (params.type) setType(params.type as TransactionType);
    if (params.amount != null) setAmount(params.amount);
    if (params.description != null) setDescription(params.description);
  }, [params.category, params.type, params.amount, params.description]);

  // Focus champ montant au montage (clavier numérique)
  useEffect(() => {
    const t = setTimeout(() => amountInputRef.current?.focus(), 500);
    return () => clearTimeout(t);
  }, []);

  // Animation fond glissant des pills selon le type
  useEffect(() => {
    const idx = type === 'expense' ? 0 : type === 'income' ? 1 : 2;
    pillIndex.value = withTiming(idx, { duration: 250 });
  }, [type, pillIndex]);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const segmentWidth = (pillContainerWidth - 8) / 3;
    return {
      transform: [{ translateX: pillIndex.value * segmentWidth }],
    };
  });

  // Haptic quand on dépasse le budget (dépense, catégorie avec budget)
  React.useEffect(() => {
    if (type !== 'expense' || !hapticEnabled) return;
    const budget = getBudgetByCategory(category);
    if (!budget) return;
    const progress = getBudgetProgress(budget.id);
    const amountNum = parseFloat(amount) || 0;
    const overBudget = amountNum > 0 && progress.spent + amountNum > progress.limit;
    if (overBudget && !wasOverBudgetRef.current) {
      wasOverBudgetRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    if (!overBudget) wasOverBudgetRef.current = false;
  }, [type, category, amount, hapticEnabled, getBudgetByCategory, getBudgetProgress]);

  React.useEffect(() => {
    if (!params.prefill) return;
    try {
      const prefill = JSON.parse(params.prefill) as { amount?: number; category?: string; description?: string; accountId?: string; type?: TransactionType };
      if (prefill.amount != null) setAmount(String(prefill.amount));
      if (prefill.category) setCategory(prefill.category as TransactionCategory);
      if (prefill.description != null) setDescription(prefill.description);
      if (prefill.accountId && accounts.some((a) => a.id === prefill.accountId)) setAccountId(prefill.accountId);
      if (prefill.type) setType(prefill.type);
      setIsDuplicatePrefill(true);
    } catch (_) {}
  }, [params.prefill]);

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.CircleDot;
  };

  const filteredCategories = getVisibleCategories(type === 'income' ? 'income' : type === 'expense' ? 'expense' : undefined);
  React.useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((c) => c.id === category)) {
      setCategory(filteredCategories[0].id);
    }
  }, [type, filteredCategories]);

  const doSave = () => {
    if (!accountId) return;
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (isPlanned && type !== 'transfer') {
      addPlannedTransaction({
        type: type === 'income' ? 'income' : 'expense',
        amount: parseFloat(amount),
        category,
        accountId,
        plannedDate: plannedDate.toISOString(),
        description: description.trim() || 'Sans description',
      });
    } else {
      addTransaction({
        accountId,
        type,
        category,
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        date: new Date().toISOString(),
        ...(photoUris.length > 0 && { photoUris: [...photoUris] }),
        ...(voiceNoteUri && { voiceNoteUri: voiceNoteUri }),
      });
    }
    setDuplicateModalVisible(false);
    setPendingDuplicateMatches([]);
    router.back();
  };

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
      return;
    }
    if (isPlanned && type !== 'transfer') {
      doSave();
      return;
    }

    const candidate = {
      accountId,
      type,
      category,
      amount: parseFloat(amount),
      description: description.trim(),
      date: new Date().toISOString(),
    };

    if (duplicateAlertEnabled && type !== 'transfer') {
      const signature = getDuplicateIgnoreSignature(candidate);
      const ignored = ignoredDuplicateSignatures.includes(signature);
      if (!ignored) {
        const matches = findSimilarTransactions(candidate, transactions, { lookbackDays: 7 });
        if (matches.length > 0) {
          setPendingDuplicateMatches(matches);
          setDuplicateModalVisible(true);
          return;
        }
      }
    }

    doSave();
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] != null && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (type === 'transfer') return;
    const note = text.trim().toLowerCase();
    if (!note) return;
    const enabledRules = rules.filter((r) => r.enabled);
    for (const rule of enabledRules) {
      const trigger = rule.triggers.find((t) => t.type === 'note_contains');
      if (!trigger || trigger.value == null) continue;
      const keyword = String(trigger.value).toLowerCase();
      if (!keyword || !note.includes(keyword)) continue;
      const action = rule.actions.find((a) => a.type === 'set_category');
      if (!action || action.value == null) continue;
      const targetCategory = String(action.value);
      if (filteredCategories.some((c) => c.id === targetCategory) && targetCategory !== category) {
        setCategory(targetCategory as TransactionCategory);
        setAutoApplied(true);
      }
      break;
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const amountColor = type === 'income' ? '#10B981' : type === 'transfer' ? '#6366F1' : '#EF4444';

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.X size={24} color="#71717A" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Nouvelle Transaction</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Haut ~30% : montant très grand, centré, couleur dynamique */}
        <View className="items-center justify-center px-6" style={{ height: '28%' }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => amountInputRef.current?.focus()}
            className="flex-row items-center justify-center"
          >
            <Text className="text-6xl font-bold mr-1" style={{ color: amountColor }}>
              {type === 'income' ? '+' : type === 'transfer' ? '' : '-'}
            </Text>
            <TextInput
              ref={amountInputRef}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="decimal-pad"
              className="text-6xl font-bold text-center px-2 py-1"
              style={{ color: amountColor, minWidth: 140 }}
              selectTextOnFocus
            />
            <Text className="text-6xl font-bold ml-1" style={{ color: amountColor }}>
              {' '}€
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pills type : Dépense / Revenu / Virement — fond glissant */}
        <View className="px-6 mb-4">
          <View
            className="flex-row rounded-2xl p-1 relative"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: 4,
                  bottom: 4,
                  width: (pillContainerWidth - 8) / 3,
                  borderRadius: 12,
                },
                type === 'expense' && { backgroundColor: '#EF4444' },
                type === 'income' && { backgroundColor: '#10B981' },
                type === 'transfer' && { backgroundColor: '#6366F1' },
                pillAnimatedStyle,
              ]}
            />
            <TouchableOpacity onPress={() => setType('expense')} className="flex-1 py-3 rounded-xl z-10">
              <Text className={`text-center font-semibold text-sm ${type === 'expense' ? 'text-white' : 'text-onyx-500'}`}>
                Dépense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setType('income')} className="flex-1 py-3 rounded-xl z-10">
              <Text className={`text-center font-semibold text-sm ${type === 'income' ? 'text-white' : 'text-onyx-500'}`}>
                Revenu
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setType('transfer')} className="flex-1 py-3 rounded-xl z-10">
              <Text className={`text-center font-semibold text-sm ${type === 'transfer' ? 'text-white' : 'text-onyx-500'}`}>
                Virement
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {isDuplicatePrefill && (
            <View className="mx-6 mb-4 px-4 py-2 rounded-lg bg-onyx-200/30 border border-onyx-200/50">
              <Text className="text-onyx-400 text-sm">Duplicata — modifiez si besoin avant d'enregistrer</Text>
            </View>
          )}

          {/* Répéter la dernière transaction (même type) */}
          {lastTransaction && lastTransaction.type !== 'transfer' && lastTransaction.type === type && (
            <TouchableOpacity
              onPress={() => {
                setAmount(String(lastTransaction.amount));
                setCategory(lastTransaction.category);
                setDescription(lastTransaction.description || '');
                if (accounts.some((a) => a.id === lastTransaction.accountId)) {
                  setAccountId(lastTransaction.accountId);
                }
              }}
              className="mx-6 mb-4 px-4 py-3 rounded-xl flex-row items-center justify-between"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' }}
            >
              <View className="flex-1">
                <Text className="text-onyx-400 text-xs mb-1">↩ Répéter</Text>
                <Text className="text-white font-medium" numberOfLines={1}>
                  {lastTransaction.description || getCategoryById(lastTransaction.category)?.label || lastTransaction.category} • {formatCurrency(lastTransaction.amount)}
                </Text>
              </View>
              <Text className="text-accent-primary font-semibold">Utiliser</Text>
            </TouchableOpacity>
          )}

          {/* GlassCard : catégorie, compte, date, note */}
          <View className="px-6 mb-8">
            <GlassCard variant="light" className="overflow-hidden">
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Catégorie */}
          <View className="px-4 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Catégorie</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {filteredCategories.map((cat) => {
                const CatIcon = getIcon(cat.icon);
                const isSelected = category === cat.id;
                return (
                    <TouchableOpacity
                    key={cat.id}
                    onPress={() => { setCategory(cat.id); setAutoApplied(false); }}
                    className={`px-3 py-2 rounded-xl flex-row items-center ${
                      isSelected ? 'border' : ''
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? `${cat.color}20` : 'rgba(255, 255, 255, 0.08)',
                      borderColor: isSelected ? cat.color : 'transparent',
                    }}
                  >
                    <CatIcon size={16} color={isSelected ? cat.color : '#71717A'} />
                    <Text 
                      className={`ml-2 text-sm font-medium ${isSelected ? 'text-white' : 'text-onyx-500'}`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Compte */}
          <View className="px-4 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Compte</Text>
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
                        isSelected ? 'border-2' : ''
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

          {type !== 'transfer' && (
            <View className="px-4 mb-6">
              <Text className="text-onyx-500 text-sm mb-2">Quand ?</Text>
              <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <TouchableOpacity
                  onPress={() => setIsPlanned(false)}
                  className={`flex-1 py-3 rounded-xl ${!isPlanned ? 'bg-accent-primary' : ''}`}
                >
                  <Text className={`text-center font-semibold ${!isPlanned ? 'text-white' : 'text-onyx-500'}`}>
                    Ajouter maintenant
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsPlanned(true)}
                  className={`flex-1 py-3 rounded-xl ${isPlanned ? 'bg-accent-primary' : ''}`}
                >
                  <Text className={`text-center font-semibold ${isPlanned ? 'text-white' : 'text-onyx-500'}`}>
                    Prévoir pour plus tard
                  </Text>
                </TouchableOpacity>
              </View>
              {isPlanned && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="mt-3 flex-row items-center justify-between bg-onyx-100 px-4 py-3 rounded-xl"
                >
                  <Text className="text-onyx-500 text-sm">Date prévue</Text>
                  <View className="flex-row items-center">
                    <Text className="text-white font-medium">
                      {format(plannedDate, "EEEE d MMMM yyyy", { locale: fr })}
                    </Text>
                    <Icons.ChevronRight size={18} color="#71717A" style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
              )}
              {showDatePicker && (
                <View className="mt-2">
                  <DateTimePicker
                    value={plannedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      setShowDatePicker(false);
                      if (d) setPlannedDate(d);
                    }}
                    minimumDate={new Date()}
                    locale="fr-FR"
                    {...(Platform.OS === 'ios' && { style: { height: 180 } })}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      className="mt-2 py-2"
                    >
                      <Text className="text-accent-primary text-center font-medium">Valider la date</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Feedback budget en temps réel (dépense uniquement) */}
          {type === 'expense' && (() => {
            const budget = getBudgetByCategory(category);
            if (!budget) return null;
            const progress = getBudgetProgress(budget.id);
            const amountNum = parseFloat(amount) || 0;
            const projectedSpent = progress.spent + amountNum;
            const overBudget = projectedSpent > progress.limit;
            const catLabel = getCategoryById(category)?.label || category;
            if (overBudget) {
              return (
                <View className="px-4 mb-6 py-3 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                  <Text className="text-accent-danger text-sm font-medium">
                    🔴 Ce montant dépasse votre budget {catLabel}
                  </Text>
                  <Text className="text-onyx-500 text-xs mt-1">
                    {formatCurrency(progress.spent)} + {formatCurrency(amountNum)} = {formatCurrency(projectedSpent)} / {formatCurrency(progress.limit)}
                  </Text>
                </View>
              );
            }
            return (
              <View className="px-4 mb-6 py-2">
                <Text className="text-onyx-500 text-sm">
                  💚 Budget {catLabel} : {formatCurrency(projectedSpent)} / {formatCurrency(progress.limit)}
                </Text>
              </View>
            );
          })()}

          {/* Description / Note */}
          <View className="px-4 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Description (optionnel)</Text>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="Ex: Courses supermarché"
              placeholderTextColor="#52525B"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
            />
            {autoApplied && (
              <Text className="text-onyx-500 text-xs mt-1">✦ Catégorie appliquée automatiquement</Text>
            )}
          </View>

          {/* Ticket + Note vocale */}
          <View className="px-4 mb-6 flex-row" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => setReceiptModalVisible(true)}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <Icons.Camera size={18} color="#71717A" />
              <Text className="text-onyx-500 ml-2">Ticket</Text>
              {photoUris.length > 0 && <View className="ml-2 w-2 h-2 rounded-full bg-accent-primary" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVoiceNoteModalVisible(true)}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <Icons.Mic size={18} color="#71717A" />
              <Text className="text-onyx-500 ml-2">Note vocale</Text>
              {voiceNoteUri && <View className="ml-2 w-2 h-2 rounded-full bg-accent-primary" />}
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <View className="px-4 mb-6">
            <Button
              title="Enregistrer"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSave}
              icon={<Icons.Check size={20} color="white" />}
            />
          </View>
              </ScrollView>
            </GlassCard>
          </View>

          <Modal visible={receiptModalVisible} transparent animationType="slide">
            <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <View className="bg-onyx-100 rounded-t-3xl max-h-[80%]">
                <ReceiptScanner
                  onPhotosTaken={(uris) => { setPhotoUris(uris.slice(0, 3)); setReceiptModalVisible(false); }}
                  onCancel={() => setReceiptModalVisible(false)}
                  maxPhotos={3}
                />
              </View>
            </View>
          </Modal>
          <Modal visible={voiceNoteModalVisible} transparent animationType="slide">
            <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <View className="bg-onyx-100 rounded-t-3xl max-h-[80%]">
                <VoiceNote
                  onRecordingDone={(uri) => { setVoiceNoteUri(uri); setVoiceNoteModalVisible(false); }}
                  onCancel={() => setVoiceNoteModalVisible(false)}
                />
              </View>
            </View>
          </Modal>

          {/* Duplicate alert modal */}
          <DuplicateAlertModal
            visible={duplicateModalVisible}
            candidate={{
              accountId,
              type,
              category,
              amount: parseFloat(amount) || 0,
              description: description.trim(),
              date: new Date().toISOString(),
            }}
            matches={pendingDuplicateMatches}
            onConfirmAdd={doSave}
            onCancel={() => {
              setDuplicateModalVisible(false);
              setPendingDuplicateMatches([]);
            }}
            onViewTransaction={(txId) => {
              const tx = transactions.find((t) => t.id === txId);
              setDuplicateModalVisible(false);
              if (tx) router.push(`/account/${tx.accountId}`);
            }}
            onDontAlertAgain={() => {
              const candidate = {
                accountId,
                type,
                category,
                amount: parseFloat(amount) || 0,
                description: description.trim(),
                date: new Date().toISOString(),
              };
              addIgnoredDuplicateSignature(getDuplicateIgnoreSignature(candidate));
            }}
          />

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
