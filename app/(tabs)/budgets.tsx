// ============================================
// ONYX - Budgets Screen
// Gestion des budgets avec jauges
// ============================================

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from 'react-native-reanimated';
import { useBudgetStore, useTransactionStore } from '@/stores';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { CATEGORIES, TransactionCategory, Budget, AVAILABLE_COLORS } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { BudgetAssistant } from '@/components/budgets/BudgetAssistant';

interface BudgetGaugeProps {
  budget: Budget;
  spent: number;
  percentage: number;
}

function BudgetGauge({ budget, spent, percentage }: BudgetGaugeProps) {
  const category = CATEGORIES.find((c) => c.id === budget.category);
  const Icon = category ? (Icons as any)[category.icon] : Icons.CircleDot;
  
  const isOverBudget = percentage >= 100;
  const isWarning = percentage >= 80 && percentage < 100;
  
  const progressColor = isOverBudget ? '#EF4444' : isWarning ? '#F59E0B' : budget.color;
  const remaining = Math.max(budget.limit - spent, 0);

  return (
    <GlassCard className="mb-4">
      <View className="flex-row items-center mb-4">
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${budget.color}20` }}
        >
          <Icon size={24} color={budget.color} />
        </View>
        
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold">{category?.label || 'Budget'}</Text>
          <Text className="text-onyx-500 text-sm">
            {budget.period === 'weekly' ? 'Hebdomadaire' : 
             budget.period === 'monthly' ? 'Mensuel' : 'Annuel'}
          </Text>
        </View>
        
        <View className="items-end">
          <Text 
            className="text-lg font-bold"
            style={{ color: isOverBudget ? '#EF4444' : '#fff' }}
          >
            {formatCurrency(spent)}
          </Text>
          <Text className="text-onyx-500 text-sm">sur {formatCurrency(budget.limit)}</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View className="mb-2">
        <View 
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <Animated.View
            className="h-full rounded-full"
            style={{ 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </View>
      </View>
      
      <View className="flex-row justify-between">
        <Text className="text-onyx-500 text-sm">
          {formatPercentage(percentage)} utilisé
        </Text>
        <Text 
          className="text-sm font-medium"
          style={{ color: isOverBudget ? '#EF4444' : '#10B981' }}
        >
          {isOverBudget 
            ? `Dépassé de ${formatCurrency(spent - budget.limit)}`
            : `Reste ${formatCurrency(remaining)}`
          }
        </Text>
      </View>
    </GlassCard>
  );
}

export default function BudgetsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // Form state
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  
  const { budgets, addBudget, updateBudget, deleteBudget, getAllBudgetsProgress } = useBudgetStore();
  const budgetsWithProgress = getAllBudgetsProgress();
  
  // Calculs
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithProgress.reduce((sum, b) => sum + b.spent, 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const expenseCategories = CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both');

  const resetForm = () => {
    setCategory('food');
    setLimit('');
    setPeriod('monthly');
    setColor(AVAILABLE_COLORS[0]);
    setEditingBudget(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategory(budget.category);
    setLimit(budget.limit.toString());
    setPeriod(budget.period);
    setColor(budget.color);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!limit || parseFloat(limit) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    const budgetData = {
      category,
      limit: parseFloat(limit),
      period,
      color,
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, budgetData);
    } else {
      // Vérifier si un budget existe déjà pour cette catégorie
      const existing = budgets.find((b) => b.category === category);
      if (existing) {
        Alert.alert('Erreur', 'Un budget existe déjà pour cette catégorie');
        return;
      }
      addBudget(budgetData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editingBudget) {
      Alert.alert(
        'Supprimer le budget',
        'Voulez-vous vraiment supprimer ce budget ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deleteBudget(editingBudget.id);
              setModalVisible(false);
              resetForm();
            },
          },
        ]
      );
    }
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
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-white text-2xl font-bold">Budgets</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Résumé global */}
          <GlassCard variant="light" className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-onyx-500">Total des budgets</Text>
              <Text 
                className="text-2xl font-bold"
                style={{ color: totalPercentage >= 100 ? '#EF4444' : '#fff' }}
              >
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
              </Text>
            </View>
            
            <View 
              className="h-4 rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <View
                className="h-full rounded-full"
                style={{ 
                  width: `${Math.min(totalPercentage, 100)}%`,
                  backgroundColor: totalPercentage >= 100 ? '#EF4444' : 
                                   totalPercentage >= 80 ? '#F59E0B' : '#10B981',
                }}
              />
            </View>
            
            <Text className="text-onyx-500 text-sm text-center">
              {formatPercentage(totalPercentage)} du budget total utilisé
            </Text>
          </GlassCard>

          {/* Assistant budget (suggestions 3 mois) */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Assistant budget</Text>
            <BudgetAssistant />
          </View>

          {/* Liste des budgets */}
          {budgetsWithProgress.length === 0 ? (
            <View className="items-center py-12">
              <Icons.PieChart size={64} color="#3F3F46" />
              <Text className="text-white text-lg font-semibold mt-4">Aucun budget défini</Text>
              <Text className="text-onyx-500 text-base mt-2 text-center">
                Créez des budgets pour suivre vos dépenses par catégorie
              </Text>
            </View>
          ) : (
            budgetsWithProgress.map((budget) => (
              <TouchableOpacity key={budget.id} onPress={() => openEditModal(budget)}>
                <BudgetGauge
                  budget={budget}
                  spent={budget.spent}
                  percentage={budget.percentage}
                />
              </TouchableOpacity>
            ))
          )}

          {/* Bouton Ajouter */}
          <TouchableOpacity
            onPress={openAddModal}
            className="mb-6 p-4 rounded-2xl items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderStyle: 'dashed',
            }}
          >
            <Icons.Plus size={24} color="#6366F1" />
            <Text className="text-accent-primary font-medium mt-2">Ajouter un budget</Text>
          </TouchableOpacity>

          <View className="h-24" />
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
                  {editingBudget ? 'Modifier' : 'Nouveau Budget'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text className="text-accent-primary text-base font-semibold">Enregistrer</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                {/* Catégorie */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Catégorie</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {expenseCategories.map((cat) => {
                      const CatIcon = getIcon(cat.icon);
                      const isSelected = category === cat.id;
                      const hasExisting = !editingBudget && budgets.some((b) => b.category === cat.id);
                      
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => !hasExisting && setCategory(cat.id)}
                          disabled={hasExisting}
                          className={`px-3 py-2 rounded-xl flex-row items-center ${
                            isSelected ? 'border' : ''
                          }`}
                          style={{ 
                            backgroundColor: isSelected ? `${cat.color}20` : 'rgba(255, 255, 255, 0.08)',
                            borderColor: isSelected ? cat.color : 'transparent',
                            opacity: hasExisting ? 0.4 : 1,
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

                {/* Limite */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Limite de dépenses (€)</Text>
                  <TextInput
                    value={limit}
                    onChangeText={setLimit}
                    placeholder="Ex: 500"
                    placeholderTextColor="#52525B"
                    keyboardType="decimal-pad"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Période */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Période</Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {[
                      { id: 'weekly', label: 'Semaine' },
                      { id: 'monthly', label: 'Mois' },
                      { id: 'yearly', label: 'Année' },
                    ].map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setPeriod(p.id as any)}
                        className={`flex-1 py-3 rounded-xl ${
                          period === p.id ? 'bg-accent-primary' : 'bg-onyx-100'
                        }`}
                      >
                        <Text 
                          className={`text-center font-medium ${
                            period === p.id ? 'text-white' : 'text-onyx-500'
                          }`}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
                {editingBudget && (
                  <Button
                    title="Supprimer ce budget"
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
