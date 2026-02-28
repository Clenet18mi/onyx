// ============================================
// ONYX - Payday Modal Component
// Modal rapide pour ajouter le salaire
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useAccountStore, useTransactionStore, useSettingsStore, useConfigStore, useSubscriptionStore, useGoalStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { storage } from '@/utils/storage';

interface PaydayModalProps {
  visible: boolean;
  onClose: () => void;
  onDismissLater?: () => void;
  onRecordSalary?: () => void;
}

export function PaydayModal({ visible, onClose, onDismissLater, onRecordSalary }: PaydayModalProps) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('Salaire');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const profile = useConfigStore((state) => state.profile);
  const subscriptionsMonthly = useSubscriptionStore((state) => state.getTotalMonthlySubscriptions());
  const goals = useGoalStore((state) => state.goals.filter((g) => !g.isCompleted));
  const salaryConfig = profile?.defaultSalaryAmount ?? 0;
  const goalsContribution = 0;
  const freeBudget = Math.max(0, salaryConfig - subscriptionsMonthly - goalsContribution);
  
  // Animation
  const scale = useSharedValue(0.8);
  const confettiOpacity = useSharedValue(0);

  // Récupérer le dernier salaire saisi ou le salaire configuré
  useEffect(() => {
    if (visible) {
      const configAmount = profile?.defaultSalaryAmount;
      if (configAmount != null && configAmount > 0) setAmount(String(configAmount));
      else {
        (async () => {
          const lastSalary = await storage.getString('last_salary_amount');
          if (lastSalary) setAmount(lastSalary);
        })();
      }
      (async () => {
        const lastAccountId = await storage.getString('last_salary_account');
        if (lastAccountId && accounts.find((a) => a.id === lastAccountId)) {
          setAccountId(lastAccountId);
        } else if (accounts.length > 0) {
          setAccountId(accounts[0].id);
        }
      })();
      scale.value = withSpring(1, { damping: 15 });
    }
  }, [visible, accounts, profile?.defaultSalaryAmount]);

  const handleAddSalary = () => {
    const salaryAmount = parseFloat(amount);
    
    if (!salaryAmount || salaryAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
      return;
    }

    // Sauvegarder pour la prochaine fois
    storage.set('last_salary_amount', amount).catch(() => {});
    storage.set('last_salary_account', accountId).catch(() => {});

    // Ajouter la transaction
    addTransaction({
      accountId,
      type: 'income',
      category: 'salary',
      amount: salaryAmount,
      description: description || 'Salaire',
      date: new Date().toISOString(),
    });

    // Animation de succès
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setShowSuccess(true);
    confettiOpacity.value = withSequence(
      withSpring(1),
      withDelay(1500, withSpring(0))
    );

    setTimeout(() => {
      setShowSuccess(false);
      onRecordSalary?.();
      onClose();
    }, 2000);
  };

  const handleLater = () => {
    onDismissLater?.();
    onClose();
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Wallet;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const selectedAccount = accounts.find(a => a.id === accountId);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <Animated.View style={animatedStyle} className="w-full">
          {showSuccess ? (
            // Écran de succès
            <GlassCard variant="light" className="items-center py-12">
              <Animated.View style={confettiStyle}>
                <Text className="text-6xl mb-4">🎉</Text>
              </Animated.View>
              <Text className="text-white text-2xl font-bold mb-2">Salaire ajouté !</Text>
              <Text className="text-accent-success text-3xl font-bold">
                +{formatCurrency(parseFloat(amount))}
              </Text>
              <Text className="text-onyx-500 mt-2">
                sur {selectedAccount?.name}
              </Text>
            </GlassCard>
          ) : (
            // Formulaire
            <GlassCard variant="light">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                  >
                    <Icons.Banknote size={24} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">Payday! 💰</Text>
                    <Text className="text-onyx-500">Ajouter votre salaire</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Icons.X size={24} color="#71717A" />
                </TouchableOpacity>
              </View>

              {/* Répartition */}
              <View className="mb-6 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Text className="text-onyx-500 text-xs mb-2">Répartition du mois</Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-onyx-400 text-sm">Salaire configuré</Text>
                  <Text className="text-accent-success font-medium">{formatCurrency(salaryConfig)}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-onyx-400 text-sm">Abonnements du mois</Text>
                  <Text className="text-accent-danger font-medium">−{formatCurrency(subscriptionsMonthly)}</Text>
                </View>
                {goalsContribution > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-onyx-400 text-sm">Contribution objectifs</Text>
                    <Text className="text-onyx-400 font-medium">−{formatCurrency(goalsContribution)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                  <Text className="text-white font-medium">Budget libre</Text>
                  <Text className="text-white font-semibold">{formatCurrency(freeBudget)}</Text>
                </View>
              </View>

              {/* Montant */}
              <View className="mb-6">
                <Text className="text-onyx-500 text-sm mb-2">Montant net reçu</Text>
                <View className="flex-row items-center">
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="2500.00"
                    placeholderTextColor="#52525B"
                    keyboardType="decimal-pad"
                    className="flex-1 bg-onyx-100 text-white text-2xl font-bold px-4 py-4 rounded-xl"
                  />
                  <Text className="text-onyx-500 text-xl ml-3">€</Text>
                </View>
              </View>

              {/* Compte */}
              <View className="mb-6">
                <Text className="text-onyx-500 text-sm mb-2">Créditeur sur</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
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
              </View>

              {/* Description optionnelle */}
              <View className="mb-6">
                <Text className="text-onyx-500 text-sm mb-2">Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Salaire, Prime, Bonus..."
                  placeholderTextColor="#52525B"
                  className="bg-onyx-100 text-white px-4 py-3 rounded-xl"
                />
              </View>

              {/* Bouton */}
              <Button
                title="Enregistrer mon salaire"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleAddSalary}
              />
              <TouchableOpacity
                onPress={handleLater}
                className="mt-3 py-2"
              >
                <Text className="text-onyx-500 text-center text-sm">Plus tard</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
