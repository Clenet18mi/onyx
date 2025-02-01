// ============================================
// ONYX - Categories Settings Screen
// Gestion des catégories personnalisées
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useConfigStore, CustomCategory } from '@/stores';
import { AVAILABLE_COLORS } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

const AVAILABLE_ICONS = [
  'Briefcase', 'Laptop', 'TrendingUp', 'Gift', 'RotateCcw',
  'UtensilsCrossed', 'Car', 'Home', 'Zap', 'Gamepad2',
  'ShoppingBag', 'Heart', 'GraduationCap', 'Plane', 'CreditCard',
  'Shield', 'FileText', 'PiggyBank', 'ArrowLeftRight', 'MoreHorizontal',
  'Coffee', 'Beer', 'Music', 'Film', 'Book', 'Dumbbell',
  'Baby', 'Dog', 'Phone', 'Wifi', 'Cloud', 'Star',
];

export default function CategoriesSettingsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Form state
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('CircleDot');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');
  
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    toggleCategoryVisibility,
    resetCategoriesToDefault,
  } = useConfigStore();

  const filteredCategories = categories
    .filter(c => filterType === 'all' || c.type === filterType || c.type === 'both')
    .sort((a, b) => a.order - b.order);

  const resetForm = () => {
    setLabel('');
    setIcon('CircleDot');
    setColor(AVAILABLE_COLORS[0]);
    setType('expense');
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (category: CustomCategory) => {
    setEditingCategory(category);
    setLabel(category.label);
    setIcon(category.icon);
    setColor(category.color);
    setType(category.type);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, { label: label.trim(), icon, color, type });
    } else {
      addCategory({ label: label.trim(), icon, color, type, isHidden: false });
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editingCategory) {
      if (editingCategory.isDefault) {
        Alert.alert('Impossible', 'Les catégories par défaut ne peuvent pas être supprimées, mais vous pouvez les masquer.');
        return;
      }
      
      Alert.alert(
        'Supprimer la catégorie',
        `Voulez-vous supprimer "${editingCategory.label}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deleteCategory(editingCategory.id);
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
      'Voulez-vous restaurer les catégories par défaut ? Vos catégories personnalisées seront perdues.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: resetCategoriesToDefault,
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
            <Text className="text-white text-xl font-bold">Catégories</Text>
          </View>
          <TouchableOpacity onPress={openAddModal}>
            <Icons.Plus size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Filtres */}
        <View className="px-6 mb-4">
          <View className="flex-row rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {[
              { id: 'all', label: 'Tout' },
              { id: 'income', label: 'Revenus' },
              { id: 'expense', label: 'Dépenses' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilterType(f.id as any)}
                className={`flex-1 py-3 ${filterType === f.id ? 'bg-accent-primary' : ''}`}
              >
                <Text className={`text-center font-medium ${filterType === f.id ? 'text-white' : 'text-onyx-500'}`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {filteredCategories.map((category) => {
            const Icon = getIcon(category.icon);
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => openEditModal(category)}
                className="mb-2"
              >
                <GlassCard>
                  <View className="flex-row items-center">
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${category.color}20`, opacity: category.isHidden ? 0.5 : 1 }}
                    >
                      <Icon size={20} color={category.color} />
                    </View>
                    
                    <View className="flex-1" style={{ opacity: category.isHidden ? 0.5 : 1 }}>
                      <Text className="text-white font-medium">{category.label}</Text>
                      <Text className="text-onyx-500 text-sm">
                        {category.type === 'income' ? 'Revenu' : 
                         category.type === 'expense' ? 'Dépense' : 'Les deux'}
                        {category.isDefault && ' • Par défaut'}
                      </Text>
                    </View>
                    
                    <Switch
                      value={!category.isHidden}
                      onValueChange={() => toggleCategoryVisibility(category.id)}
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
            <Text className="text-accent-danger font-medium">Restaurer les catégories par défaut</Text>
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
                  {editingCategory ? 'Modifier' : 'Nouvelle Catégorie'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text className="text-accent-primary text-base font-semibold">Enregistrer</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                {/* Nom */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Nom de la catégorie</Text>
                  <TextInput
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Ex: Restaurant"
                    placeholderTextColor="#52525B"
                    className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base"
                  />
                </View>

                {/* Type */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Type</Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {[
                      { id: 'expense', label: 'Dépense' },
                      { id: 'income', label: 'Revenu' },
                      { id: 'both', label: 'Les deux' },
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setType(t.id as any)}
                        className={`flex-1 py-3 rounded-xl ${type === t.id ? 'bg-accent-primary' : 'bg-onyx-100'}`}
                      >
                        <Text className={`text-center font-medium ${type === t.id ? 'text-white' : 'text-onyx-500'}`}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Icône */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Icône</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                    {AVAILABLE_ICONS.map((iconName) => {
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

                {/* Aperçu */}
                <View className="mb-6">
                  <Text className="text-onyx-500 text-sm mb-2">Aperçu</Text>
                  <GlassCard>
                    <View className="flex-row items-center">
                      <View 
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        {React.createElement(getIcon(icon), { size: 24, color })}
                      </View>
                      <Text className="text-white text-lg font-medium">{label || 'Nom de la catégorie'}</Text>
                    </View>
                  </GlassCard>
                </View>

                {/* Supprimer */}
                {editingCategory && !editingCategory.isDefault && (
                  <Button
                    title="Supprimer cette catégorie"
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
