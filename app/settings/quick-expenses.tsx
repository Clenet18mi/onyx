// ============================================
// ONYX - Quick Expenses Settings Screen
// Gestion des templates de dépenses rapides
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useConfigStore, QuickExpenseTemplate } from '@/stores';
import { AVAILABLE_COLORS } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';

const QUICK_ICONS = [
  'Coffee', 'UtensilsCrossed', 'Train', 'ShoppingCart', 'Fuel', 'Ticket',
  'Beer', 'Pizza', 'Bus', 'Car', 'Bike', 'Plane',
  'Popcorn', 'Music', 'Dumbbell', 'ShoppingBag', 'Pill', 'Book',
  'Gamepad2', 'Film', 'Gift', 'Phone', 'Wifi', 'Zap',
];

export default function QuickExpensesSettingsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickExpenseTemplate | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [icon, setIcon] = useState('Coffee');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [categoryId, setCategoryId] = useState('food');
  
  const { 
    quickExpenses,
    categories,
    addQuickExpense, 
    updateQuickExpense, 
    deleteQuickExpense,
    toggleQuickExpenseActive,
    resetQuickExpensesToDefault,
  } = useConfigStore();

  const sortedTemplates = [...quickExpenses].sort((a, b) => a.order - b.order);
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  const resetForm = () => {
    setName('');
    setDefaultAmount('');
    setIcon('Coffee');
    setColor(AVAILABLE_COLORS[0]);
    setCategoryId('food');
    setEditingTemplate(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (template: QuickExpenseTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setDefaultAmount(template.defaultAmount?.toString() || '');
    setIcon(template.icon);
    setColor(template.color);
    setCategoryId(template.categoryId);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    const templateData = {
      name: name.trim(),
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      icon,
      color,
      categoryId,
      isActive: true,
    };

    if (editingTemplate) {
      updateQuickExpense(editingTemplate.id, templateData);
    } else {
      addQuickExpense(templateData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editingTemplate) {
      Alert.alert(
        'Supprimer',
        `Voulez-vous supprimer "${editingTemplate.name}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deleteQuickExpense(editingTemplate.id);
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
      'Voulez-vous restaurer les dépenses rapides par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: resetQuickExpensesToDefault,
        },
      ]
    );
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.CircleDot;
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
            <Text className="text-white text-xl font-bold">Dépenses Rapides</Text>
          </View>
          <TouchableOpacity onPress={openAddModal}>
            <Icons.Plus size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Text className="text-onyx-500 text-sm mb-4">
            Ces boutons apparaissent sur le dashboard pour ajouter rapidement des dépenses courantes.
          </Text>

          {sortedTemplates.map((template) => {
            const Icon = getIcon(template.icon);
            const category = categories.find(c => c.id === template.categoryId);
            
            return (
              <TouchableOpacity
                key={template.id}
                onPress={() => openEditModal(template)}
                className="mb-2"
              >
                <GlassCard>
                  <View className="flex-row items-center">
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${template.color}20`, opacity: template.isActive ? 1 : 0.5 }}
                    >
                      <Icon size={20} color={template.color} />
                    </View>
                    
                    <View className="flex-1" style={{ opacity: template.isActive ? 1 : 0.5 }}>
                      <Text className="text-white font-medium">{template.name}</Text>
                      <Text className="text-onyx-500 text-sm">
                        {category?.label || 'Catégorie'}
                        {template.defaultAmount && ` • ${formatCurrency(template.defaultAmount)}`}
                      </Text>
                    </View>
                    
                    <Switch
                      value={template.isActive}
                      onValueChange={() => toggleQuickExpenseActive(template.id)}
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
            <Text className="text-accent-danger font-medium">Restaurer les dépenses par défaut</Text>
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
                  {editingTemplate ? 'Modifier' : 'Nouvelle Dépense Rapide'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
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
                    placeholder="Ex: Café, Métro, Boulangerie..."
                    placeholderTextColor="#52525B"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Montant par défaut */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Montant par défaut (optionnel)</Text>
                  <TextInput
                    value={defaultAmount}
                    onChangeText={setDefaultAmount}
                    placeholder="Ex: 3.50"
                    placeholderTextColor="#52525B"
                    keyboardType="decimal-pad"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Catégorie */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Catégorie</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 8 }}>
                      {expenseCategories.map((cat) => {
                        const CatIcon = getIcon(cat.icon);
                        const isSelected = categoryId === cat.id;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => setCategoryId(cat.id)}
                            className={`px-3 py-2 rounded-xl flex-row items-center ${isSelected ? 'border' : ''}`}
                            style={{ 
                              backgroundColor: isSelected ? `${cat.color}20` : 'rgba(255, 255, 255, 0.08)',
                              borderColor: isSelected ? cat.color : 'transparent',
                            }}
                          >
                            <CatIcon size={16} color={isSelected ? cat.color : '#71717A'} />
                            <Text className={`ml-2 text-sm ${isSelected ? 'text-white' : 'text-onyx-500'}`}>
                              {cat.label}
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
                  <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                    {QUICK_ICONS.map((iconName) => {
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

                {/* Supprimer */}
                {editingTemplate && (
                  <Button
                    title="Supprimer"
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
