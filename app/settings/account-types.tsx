// ============================================
// ONYX - Account Types Settings Screen
// Gestion des types de comptes personnalisés
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useConfigStore, CustomAccountType } from '@/stores';
import { AVAILABLE_COLORS } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

const ACCOUNT_ICONS = [
  'Wallet', 'PiggyBank', 'Banknote', 'TrendingUp', 'Bitcoin',
  'Building', 'CreditCard', 'Landmark', 'Coins', 'DollarSign',
  'Euro', 'Briefcase', 'Home', 'Car', 'ShoppingBag',
  'Globe', 'Gem', 'Crown', 'Gift', 'CircleDollarSign',
];

export default function AccountTypesSettingsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<CustomAccountType | null>(null);
  
  // Form state
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [defaultColor, setDefaultColor] = useState(AVAILABLE_COLORS[0]);
  
  const { 
    accountTypes, 
    addAccountType, 
    updateAccountType, 
    deleteAccountType,
    toggleAccountTypeVisibility,
    resetAccountTypesToDefault,
  } = useConfigStore();

  const sortedTypes = [...accountTypes].sort((a, b) => a.order - b.order);

  const resetForm = () => {
    setLabel('');
    setIcon('Wallet');
    setDefaultColor(AVAILABLE_COLORS[0]);
    setEditingType(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (accountType: CustomAccountType) => {
    setEditingType(accountType);
    setLabel(accountType.label);
    setIcon(accountType.icon);
    setDefaultColor(accountType.defaultColor);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    if (editingType) {
      updateAccountType(editingType.id, { label: label.trim(), icon, defaultColor });
    } else {
      addAccountType({ label: label.trim(), icon, defaultColor, isHidden: false });
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editingType) {
      if (editingType.isDefault) {
        Alert.alert('Impossible', 'Les types par défaut ne peuvent pas être supprimés, mais vous pouvez les masquer.');
        return;
      }
      
      Alert.alert(
        'Supprimer le type',
        `Voulez-vous supprimer "${editingType.label}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deleteAccountType(editingType.id);
              setModalVisible(false);
              resetForm();
            },
          },
        ]
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous restaurer les types de comptes par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: resetAccountTypesToDefault,
        },
      ]
    );
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Wallet;
  };

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Icons.ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Types de Comptes</Text>
          </View>
          <TouchableOpacity onPress={openAddModal}>
            <Icons.Plus size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {sortedTypes.map((accountType) => {
            const Icon = getIcon(accountType.icon);
            return (
              <TouchableOpacity
                key={accountType.id}
                onPress={() => openEditModal(accountType)}
                className="mb-2"
              >
                <GlassCard>
                  <View className="flex-row items-center">
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${accountType.defaultColor}20`, opacity: accountType.isHidden ? 0.5 : 1 }}
                    >
                      <Icon size={20} color={accountType.defaultColor} />
                    </View>
                    
                    <View className="flex-1" style={{ opacity: accountType.isHidden ? 0.5 : 1 }}>
                      <Text className="text-white font-medium">{accountType.label}</Text>
                      {accountType.isDefault && (
                        <Text className="text-onyx-500 text-sm">Par défaut</Text>
                      )}
                    </View>
                    
                    <Switch
                      value={!accountType.isHidden}
                      onValueChange={() => toggleAccountTypeVisibility(accountType.id)}
                      trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                      thumbColor="#fff"
                    />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}

          {/* Bouton Reset */}
          <TouchableOpacity
            onPress={handleReset}
            className="mt-4 mb-8 p-4 rounded-xl items-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <Text className="text-accent-danger font-medium">Restaurer les types par défaut</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-onyx">
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-onyx-200/10">
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text className="text-onyx-500 text-base">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">
                  {editingType ? 'Modifier' : 'Nouveau Type'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text className="text-accent-primary text-base font-semibold">Enregistrer</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                {/* Nom */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Nom du type de compte</Text>
                  <TextInput
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Ex: Compte Joint"
                    placeholderTextColor="#52525B"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Icône */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Icône</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                    {ACCOUNT_ICONS.map((iconName) => {
                      const IconComp = getIcon(iconName);
                      return (
                        <TouchableOpacity
                          key={iconName}
                          onPress={() => setIcon(iconName)}
                          className={`w-11 h-11 rounded-xl items-center justify-center ${
                            icon === iconName ? 'bg-accent-primary' : 'bg-onyx-100'
                          }`}
                        >
                          <IconComp size={22} color={icon === iconName ? 'white' : '#71717A'} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Couleur par défaut */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Couleur par défaut</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                    {AVAILABLE_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setDefaultColor(c)}
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          defaultColor === c ? 'border-2 border-white' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {defaultColor === c && <Icons.Check size={20} color="white" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Aperçu */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Aperçu</Text>
                  <GlassCard>
                    <View className="flex-row items-center">
                      <View 
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${defaultColor}20` }}
                      >
                        {React.createElement(getIcon(icon), { size: 24, color: defaultColor })}
                      </View>
                      <Text className="text-white text-lg font-medium">{label || 'Type de compte'}</Text>
                    </View>
                  </GlassCard>
                </View>

                {/* Supprimer */}
                {editingType && !editingType.isDefault && (
                  <Button
                    title="Supprimer ce type"
                    variant="danger"
                    fullWidth
                    onPress={handleDelete}
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
