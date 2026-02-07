// ============================================
// ONYX - Add Transaction Screen
// Écran d'ajout de transaction
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAccountStore, useTransactionStore, useSettingsStore, usePlannedTransactionStore } from '@/stores';
import { CATEGORIES, TransactionCategory, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/format';
import { findSimilarTransactions, getDuplicateIgnoreSignature } from '@/utils/duplicateDetector';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { DuplicateAlertModal, ReceiptScanner, VoiceNote } from '@/components/transactions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string; category?: string; type?: string; amount?: string; description?: string }>();
  
  const [type, setType] = useState<TransactionType>((params.type as TransactionType) || 'expense');
  const [amount, setAmount] = useState(params.amount ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [category, setCategory] = useState<TransactionCategory>((params.category as TransactionCategory) || 'other');
  const [accountId, setAccountId] = useState(params.accountId || '');
  
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const transactions = useTransactionStore((state) => state.transactions);
  const addPlannedTransaction = usePlannedTransactionStore((state) => state.addPlannedTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const duplicateAlertEnabled = useSettingsStore((state) => state.duplicateAlertEnabled ?? true);
  const ignoredDuplicateSignatures = useSettingsStore((state) => state.ignoredDuplicateSignatures ?? []);
  const addIgnoredDuplicateSignature = useSettingsStore((state) => state.addIgnoredDuplicateSignature);

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
  const [voiceNoteUri, setVoiceNoteUri] = useState<string | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [voiceNoteModalVisible, setVoiceNoteModalVisible] = useState(false);

  // Sélectionner le premier compte si aucun n'est sélectionné ; appliquer params template
  React.useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(params.accountId || accounts[0].id);
    }
  }, [accounts, params.accountId]);
  React.useEffect(() => {
    if (params.category) setCategory(params.category as TransactionCategory);
    if (params.type) setType(params.type as TransactionType);
    if (params.amount != null) setAmount(params.amount);
    if (params.description != null) setDescription(params.description);
  }, [params.category, params.type, params.amount, params.description]);

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.CircleDot;
  };

  const filteredCategories = CATEGORIES.filter(
    (c) => c.type === type || c.type === 'both'
  );

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

  const selectedAccount = accounts.find((a) => a.id === accountId);

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

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Type Toggle */}
          <View className="px-6 mb-6">
            <View 
              className="flex-row rounded-2xl p-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <TouchableOpacity
                onPress={() => setType('expense')}
                className={`flex-1 py-3 rounded-xl ${type === 'expense' ? 'bg-accent-danger' : ''}`}
              >
                <Text className={`text-center font-semibold ${type === 'expense' ? 'text-white' : 'text-onyx-500'}`}>
                  Dépense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType('income')}
                className={`flex-1 py-3 rounded-xl ${type === 'income' ? 'bg-accent-success' : ''}`}
              >
                <Text className={`text-center font-semibold ${type === 'income' ? 'text-white' : 'text-onyx-500'}`}>
                  Revenu
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ajouter maintenant / Prévoir (masqué pour virement) */}
          {type !== 'transfer' && (
            <View className="px-6 mb-6">
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

          {/* Montant : tap pour ouvrir le clavier du téléphone */}
          <View className="px-6 mb-8 items-center">
            <Text className="text-onyx-500 text-sm mb-2">Montant</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => amountInputRef.current?.focus()}
              className="flex-row items-center justify-center min-h-[72px]"
            >
              <Text
                className="text-4xl font-bold mr-1"
                style={{ color: type === 'income' ? '#10B981' : '#EF4444' }}
              >
                {type === 'income' ? '+' : '-'}
              </Text>
              <TextInput
                ref={amountInputRef}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                className="text-4xl font-bold text-center px-2 py-1"
                style={{ color: type === 'income' ? '#10B981' : '#EF4444', minWidth: 100 }}
                selectTextOnFocus
              />
              <Text
                className="text-4xl font-bold ml-1"
                style={{ color: type === 'income' ? '#10B981' : '#EF4444' }}
              >
                {' '}€
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Selector */}
          <View className="px-6 mb-6">
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

          {/* Category Selector */}
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Catégorie</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {filteredCategories.map((cat) => {
                const CatIcon = getIcon(cat.icon);
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
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

          {/* Description */}
          <View className="px-6 mb-6">
            <Text className="text-onyx-500 text-sm mb-2">Description (optionnel)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Courses supermarché"
              placeholderTextColor="#52525B"
              className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          {/* Ticket + Note vocale */}
          <View className="px-6 mb-6 flex-row" style={{ gap: 12 }}>
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

          {/* Save Button */}
          <View className="px-6 mb-8">
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
      </SafeAreaView>
    </LinearGradient>
  );
}
