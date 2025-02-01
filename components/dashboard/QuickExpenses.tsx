// ============================================
// ONYX - Quick Expenses Component
// Boutons rapides pour dépenses courantes
// (Utilise le configStore pour la personnalisation)
// ============================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAccountStore, useTransactionStore, useSettingsStore, useConfigStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { storage } from '@/utils/storage';

interface QuickExpenseModalProps {
  visible: boolean;
  template: any;
  onClose: () => void;
}

function QuickExpenseModal({ visible, template, onClose }: QuickExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  React.useEffect(() => {
    if (visible && template) {
      setAmount(template.defaultAmount?.toString() || '');
      setDescription(template.name);
      const lastAccount = storage.getString('last_expense_account');
      if (lastAccount && accounts.find(a => a.id === lastAccount)) {
        setAccountId(lastAccount);
      } else if (accounts.length > 0) {
        setAccountId(accounts[0].id);
      }
    }
  }, [visible, template]);

  const handleSave = () => {
    const expenseAmount = parseFloat(amount);
    
    if (!expenseAmount || expenseAmount <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Sélectionnez un compte');
      return;
    }

    storage.set('last_expense_account', accountId);

    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addTransaction({
      accountId,
      type: 'expense',
      category: template?.categoryId || 'other',
      amount: expenseAmount,
      description: description || template?.name || 'Dépense',
      date: new Date().toISOString(),
    });

    onClose();
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.CircleDot;
  };

  if (!template) return null;

  const TemplateIcon = getIcon(template.icon);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <GlassCard variant="light" className="w-full">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <View 
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${template.color}20` }}
              >
                <TemplateIcon size={24} color={template.color} />
              </View>
              <Text className="text-white text-xl font-bold">{template.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icons.X size={24} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Montant */}
          <View className="mb-4">
            <Text className="text-onyx-500 text-sm mb-2">Montant</Text>
            <View className="flex-row items-center">
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#52525B"
                keyboardType="decimal-pad"
                className="flex-1 bg-onyx-100 text-white text-xl font-bold px-4 py-3 rounded-xl"
                autoFocus
              />
              <Text className="text-onyx-500 text-xl ml-3">€</Text>
            </View>
          </View>

          {/* Compte */}
          <View className="mb-4">
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
                      className={`px-3 py-2 rounded-xl flex-row items-center ${isSelected ? 'border' : ''}`}
                      style={{ 
                        backgroundColor: isSelected ? `${account.color}20` : 'rgba(255, 255, 255, 0.08)',
                        borderColor: isSelected ? account.color : 'transparent',
                      }}
                    >
                      <AccountIcon size={16} color={isSelected ? account.color : '#71717A'} />
                      <Text className={`ml-2 text-sm ${isSelected ? 'text-white' : 'text-onyx-500'}`}>
                        {account.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <Button
            title="Enregistrer"
            variant="primary"
            fullWidth
            onPress={handleSave}
          />
        </GlassCard>
      </View>
    </Modal>
  );
}

export function QuickExpenses() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const quickExpenses = useConfigStore((state) => state.getActiveQuickExpenses());

  const handlePress = (template: any) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTemplate(template);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.CircleDot;
  };

  if (quickExpenses.length === 0) {
    return null;
  }

  return (
    <>
      <View className="mb-6">
        <Text className="text-white text-base font-semibold mb-3 px-1">Dépenses rapides</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4, gap: 10 }}
        >
          {quickExpenses.map((template) => {
            const Icon = getIcon(template.icon);
            return (
              <TouchableOpacity
                key={template.id}
                onPress={() => handlePress(template)}
                className="items-center"
                activeOpacity={0.7}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-1"
                  style={{ backgroundColor: `${template.color}15` }}
                >
                  <Icon size={22} color={template.color} />
                </View>
                <Text className="text-onyx-500 text-xs">{template.name}</Text>
                {template.defaultAmount && (
                  <Text className="text-onyx-600 text-xs">{template.defaultAmount}€</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <QuickExpenseModal
        visible={selectedTemplate !== null}
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </>
  );
}
