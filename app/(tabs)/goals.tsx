// ============================================
// ONYX - Goals Screen
// Projets d'épargne avec progression
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useGoalStore, useAccountStore } from '@/stores';
import { formatCurrency, formatPercentage, formatLongDate } from '@/utils/format';
import { SavingsGoal, AVAILABLE_COLORS } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

const GOAL_ICONS = [
  'Target', 'Plane', 'Car', 'Home', 'Gamepad2', 'Laptop',
  'Smartphone', 'Watch', 'Gift', 'Sparkles', 'Star', 'Heart',
  'Gem', 'Palmtree', 'Music', 'Camera',
];

interface GoalCardProps {
  goal: SavingsGoal;
  onPress: () => void;
  onContribute: () => void;
}

function GoalCard({ goal, onPress, onContribute }: GoalCardProps) {
  const Icon = (Icons as any)[goal.icon] || Icons.Target;
  const percentage = goal.targetAmount > 0 
    ? (goal.currentAmount / goal.targetAmount) * 100 
    : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <TouchableOpacity onPress={onPress}>
      <GlassCard className="mb-4">
        <View className="flex-row items-start mb-4">
          <View 
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            <Icon size={28} color={goal.color} />
          </View>
          
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold">{goal.name}</Text>
            {goal.deadline && (
              <Text className="text-onyx-500 text-sm">
                Échéance: {formatLongDate(goal.deadline)}
              </Text>
            )}
          </View>
          
          {goal.isCompleted && (
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
            >
              <Text className="text-accent-success text-sm font-medium">Atteint!</Text>
            </View>
          )}
        </View>
        
        {/* Progress */}
        <View className="mb-3">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white text-lg font-bold">
              {formatCurrency(goal.currentAmount)}
            </Text>
            <Text className="text-onyx-500">
              sur {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
          
          <View 
            className="h-4 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <LinearGradient
              colors={[goal.color, `${goal.color}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-full rounded-full"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </View>
          
          <View className="flex-row justify-between mt-2">
            <Text className="text-onyx-500 text-sm">
              {formatPercentage(percentage)}
            </Text>
            <Text className="text-onyx-500 text-sm">
              Reste {formatCurrency(remaining)}
            </Text>
          </View>
        </View>
        
        {/* Action Button */}
        {!goal.isCompleted && (
          <TouchableOpacity
            onPress={onContribute}
            className="flex-row items-center justify-center py-3 rounded-xl mt-2"
            style={{ backgroundColor: `${goal.color}30` }}
          >
            <Icons.Plus size={18} color={goal.color} />
            <Text 
              className="ml-2 font-semibold"
              style={{ color: goal.color }}
            >
              Ajouter des fonds
            </Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [contributeModalVisible, setContributeModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [accountId, setAccountId] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeFromAccount, setContributeFromAccount] = useState('');
  
  const { goals, addGoal, updateGoal, deleteGoal, contributeToGoal, getActiveGoals, getCompletedGoals } = useGoalStore();
  const accounts = useAccountStore((state) => state.getActiveAccounts());
  
  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();
  
  // Total épargné
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setIcon('Target');
    setColor(AVAILABLE_COLORS[0]);
    setAccountId(accounts[0]?.id || '');
    setEditingGoal(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setIcon(goal.icon);
    setColor(goal.color);
    setAccountId(goal.accountId);
    setModalVisible(true);
  };

  const openContributeModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributeAmount('');
    setContributeFromAccount(accounts[0]?.id || '');
    setContributeModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour votre objectif');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant cible valide');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
      return;
    }

    const goalData = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      icon,
      color,
      accountId,
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, goalData);
    } else {
      addGoal(goalData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleContribute = () => {
    if (!selectedGoal) return;
    
    const amount = parseFloat(contributeAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    
    const fromAccount = accounts.find((a) => a.id === contributeFromAccount);
    if (!fromAccount || fromAccount.balance < amount) {
      Alert.alert('Erreur', 'Solde insuffisant sur le compte sélectionné');
      return;
    }

    contributeToGoal(selectedGoal.id, amount, contributeFromAccount);
    setContributeModalVisible(false);
    setSelectedGoal(null);
  };

  const handleDelete = () => {
    if (editingGoal) {
      Alert.alert(
        'Supprimer l\'objectif',
        'L\'argent épargné sera retourné au compte lié. Continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deleteGoal(editingGoal.id);
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
    return IconComponent || Icons.Target;
  };

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-white text-2xl font-bold">Objectifs d'Épargne</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Résumé */}
          {goals.length > 0 && (
            <GlassCard variant="light" className="mb-6">
              <View className="flex-row items-center mb-2">
                <Icons.PiggyBank size={24} color="#10B981" />
                <Text className="text-onyx-500 ml-2">Total épargné</Text>
              </View>
              <Text className="text-white text-3xl font-bold mb-1">
                {formatCurrency(totalSaved)}
              </Text>
              <Text className="text-onyx-500">
                sur {formatCurrency(totalTarget)} ({formatPercentage(totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0)})
              </Text>
            </GlassCard>
          )}

          {/* Objectifs actifs */}
          {activeGoals.length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-4">En cours</Text>
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={() => openEditModal(goal)}
                  onContribute={() => openContributeModal(goal)}
                />
              ))}
            </View>
          )}

          {/* Objectifs atteints */}
          {completedGoals.length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Atteints 🎉</Text>
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={() => openEditModal(goal)}
                  onContribute={() => {}}
                />
              ))}
            </View>
          )}

          {/* État vide */}
          {goals.length === 0 && (
            <View className="items-center py-12">
              <Icons.Target size={64} color="#3F3F46" />
              <Text className="text-white text-lg font-semibold mt-4">Aucun objectif</Text>
              <Text className="text-onyx-500 text-base mt-2 text-center">
                Créez un objectif pour commencer à épargner vers un projet qui vous tient à cœur
              </Text>
            </View>
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
            <Text className="text-accent-primary font-medium mt-2">Nouvel objectif</Text>
          </TouchableOpacity>

          <View className="h-24" />
        </ScrollView>

        {/* Modal Création/Édition */}
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
                  {editingGoal ? 'Modifier' : 'Nouvel Objectif'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text className="text-accent-primary text-base font-semibold">Enregistrer</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                {/* Nom */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Nom de l'objectif</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: PlayStation 5, Voyage au Japon..."
                    placeholderTextColor="#52525B"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Montant */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Montant cible (€)</Text>
                  <TextInput
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    placeholder="Ex: 500"
                    placeholderTextColor="#52525B"
                    keyboardType="decimal-pad"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Compte lié */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Compte lié</Text>
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
                    {GOAL_ICONS.map((iconName) => {
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
                {editingGoal && (
                  <Button
                    title="Supprimer cet objectif"
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

        {/* Modal Contribution */}
        <Modal
          visible={contributeModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setContributeModalVisible(false)}
        >
          <View className="flex-1 bg-onyx">
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-onyx-200/10">
                <TouchableOpacity onPress={() => setContributeModalVisible(false)}>
                  <Text className="text-onyx-500 text-base">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">Ajouter des fonds</Text>
                <TouchableOpacity onPress={handleContribute}>
                  <Text className="text-accent-primary text-base font-semibold">Confirmer</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                {selectedGoal && (
                  <>
                    <GlassCard className="mb-6">
                      <View className="flex-row items-center">
                        {React.createElement(getIcon(selectedGoal.icon), { 
                          size: 32, 
                          color: selectedGoal.color 
                        })}
                        <View className="ml-4">
                          <Text className="text-white text-lg font-semibold">{selectedGoal.name}</Text>
                          <Text className="text-onyx-500">
                            {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>

                    {/* Montant */}
                    <View className="mb-6">
                      <Text className="text-onyx-500 text-sm mb-2">Montant à ajouter (€)</Text>
                      <TextInput
                        value={contributeAmount}
                        onChangeText={setContributeAmount}
                        placeholder="Ex: 100"
                        placeholderTextColor="#52525B"
                        keyboardType="decimal-pad"
                        className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                      />
                    </View>

                    {/* Compte source */}
                    <View className="mb-6">
                      <Text className="text-onyx-500 text-sm mb-2">Depuis le compte</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row" style={{ gap: 8 }}>
                          {accounts.map((account) => {
                            const AccountIcon = getIcon(account.icon);
                            const isSelected = contributeFromAccount === account.id;
                            return (
                              <TouchableOpacity
                                key={account.id}
                                onPress={() => setContributeFromAccount(account.id)}
                                className={`p-3 rounded-xl ${isSelected ? 'border' : ''}`}
                                style={{ 
                                  backgroundColor: isSelected ? `${account.color}20` : 'rgba(255, 255, 255, 0.08)',
                                  borderColor: isSelected ? account.color : 'transparent',
                                }}
                              >
                                <View className="flex-row items-center mb-1">
                                  <AccountIcon size={16} color={isSelected ? account.color : '#71717A'} />
                                  <Text 
                                    className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-onyx-500'}`}
                                  >
                                    {account.name}
                                  </Text>
                                </View>
                                <Text className="text-white font-semibold">
                                  {formatCurrency(account.balance)}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </>
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
