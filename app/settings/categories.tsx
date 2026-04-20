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
import { useTheme } from '@/hooks/useTheme';

const AVAILABLE_ICONS = ['Briefcase','Laptop','TrendingUp','Gift','RotateCcw','UtensilsCrossed','Car','Home','Zap','Gamepad2','ShoppingBag','Heart','GraduationCap','Plane','CreditCard','Shield','FileText','PiggyBank','ArrowLeftRight','MoreHorizontal','Coffee','Beer','Music','Film','Book','Dumbbell','Baby','Dog','Phone','Wifi','Cloud','Star'];

export default function CategoriesSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('CircleDot');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');

  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryVisibility, resetCategoriesToDefault } = useConfigStore();
  const filteredCategories = categories.filter(c => filterType === 'all' || c.type === filterType || c.type === 'both').sort((a, b) => a.order - b.order);
  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.CircleDot;
  const resetForm = () => { setLabel(''); setIcon('CircleDot'); setColor(AVAILABLE_COLORS[0]); setType('expense'); setEditingCategory(null); };
  const openAddModal = () => { resetForm(); setModalVisible(true); };
  const openEditModal = (category: CustomCategory) => { setEditingCategory(category); setLabel(category.label); setIcon(category.icon); setColor(category.color); setType(category.type); setModalVisible(true); };
  const handleSave = () => { if (!label.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; } if (editingCategory) updateCategory(editingCategory.id, { label: label.trim(), icon, color, type }); else addCategory({ label: label.trim(), icon, color, type, isHidden: false }); setModalVisible(false); resetForm(); };
  const handleDelete = () => { if (!editingCategory) return; if (editingCategory.isDefault) { Alert.alert('Impossible', 'Les catégories par défaut ne peuvent pas être supprimées, mais vous pouvez les masquer.'); return; } Alert.alert('Supprimer la catégorie', `Voulez-vous supprimer "${editingCategory.label}" ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => { deleteCategory(editingCategory.id); setModalVisible(false); resetForm(); } }]); };
  const handleReset = () => { Alert.alert('Réinitialiser', 'Voulez-vous restaurer les catégories par défaut ? Vos catégories personnalisées seront perdues.', [{ text: 'Annuler', style: 'cancel' }, { text: 'Réinitialiser', style: 'destructive', onPress: resetCategoriesToDefault }]); };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.ChevronLeft size={24} color={colors.text.primary} /></TouchableOpacity>
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>Catégories</Text>
          </View>
          <TouchableOpacity onPress={openAddModal}><Icons.Plus size={24} color={colors.accent.primary} /></TouchableOpacity>
        </View>

        <View className="px-6 mb-4">
          <View className="flex-row rounded-xl overflow-hidden" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}>
            {[{ id: 'all', label: 'Tout' }, { id: 'income', label: 'Revenus' }, { id: 'expense', label: 'Dépenses' }].map((f) => (<TouchableOpacity key={f.id} onPress={() => setFilterType(f.id as any)} className="flex-1 py-3" style={{ backgroundColor: filterType === f.id ? colors.accent.primary : 'transparent' }}><Text className="text-center font-medium" style={{ color: filterType === f.id ? '#fff' : colors.text.secondary }}>{f.label}</Text></TouchableOpacity>))}
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {filteredCategories.map((category) => { const Icon = getIcon(category.icon); return (<TouchableOpacity key={category.id} onPress={() => openEditModal(category)} className="mb-2"><GlassCard><View className="flex-row items-center"><View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${category.color}20`, opacity: category.isHidden ? 0.5 : 1 }}><Icon size={20} color={category.color} /></View><View className="flex-1" style={{ opacity: category.isHidden ? 0.5 : 1 }}><Text style={{ color: colors.text.primary, fontWeight: '600' }}>{category.label}</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>{category.type === 'income' ? 'Revenu' : category.type === 'expense' ? 'Dépense' : 'Les deux'}{category.isDefault && ' • Par défaut'}</Text></View><Switch value={!category.isHidden} onValueChange={() => toggleCategoryVisibility(category.id)} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} /></View></GlassCard></TouchableOpacity>); })}
          <TouchableOpacity onPress={handleReset} className="mt-4 mb-8 p-4 rounded-xl items-center" style={{ backgroundColor: `${colors.accent.danger}12`, borderWidth: 1, borderColor: `${colors.accent.danger}20` }}><Text style={{ color: colors.accent.danger, fontWeight: '600' }}>Restaurer les catégories par défaut</Text></TouchableOpacity>
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1" style={{ backgroundColor: colors.background.primary }}>
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.text.secondary }}>Annuler</Text></TouchableOpacity>
                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>{editingCategory ? 'Modifier' : 'Nouvelle Catégorie'}</Text>
                <TouchableOpacity onPress={handleSave}><Text style={{ color: colors.accent.primary, fontWeight: '700' }}>Enregistrer</Text></TouchableOpacity>
              </View>
              <ScrollView className="flex-1 px-6 py-4">
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Nom de la catégorie</Text><TextInput value={label} onChangeText={setLabel} placeholder="Ex: Restaurant" placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Type</Text><View className="flex-row" style={{ gap: 8 }}>{[{ id: 'expense', label: 'Dépense' }, { id: 'income', label: 'Revenu' }, { id: 'both', label: 'Les deux' }].map((t) => (<TouchableOpacity key={t.id} onPress={() => setType(t.id as any)} className="flex-1 py-3 rounded-xl" style={{ backgroundColor: type === t.id ? colors.accent.primary : colors.background.secondary, borderWidth: 1, borderColor: type === t.id ? colors.accent.primary : colors.background.tertiary }}><Text className="text-center font-medium" style={{ color: type === t.id ? '#fff' : colors.text.secondary }}>{t.label}</Text></TouchableOpacity>))}</View></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Icône</Text><View className="flex-row flex-wrap" style={{ gap: 10 }}>{AVAILABLE_ICONS.map((iconName) => { const IconComp = getIcon(iconName); return (<TouchableOpacity key={iconName} onPress={() => setIcon(iconName)} className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: icon === iconName ? `${colors.accent.primary}20` : colors.background.secondary, borderWidth: 1, borderColor: icon === iconName ? colors.accent.primary : colors.background.tertiary }}><IconComp size={22} color={icon === iconName ? colors.accent.primary : colors.text.secondary} /></TouchableOpacity>); })}</View></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Couleur</Text><View className="flex-row flex-wrap" style={{ gap: 12 }}>{AVAILABLE_COLORS.map((c) => (<TouchableOpacity key={c} onPress={() => setColor(c)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: c, borderWidth: color === c ? 2 : 1, borderColor: color === c ? '#fff' : colors.background.tertiary }}>{color === c && <Icons.Check size={20} color="white" />}</TouchableOpacity>))}</View></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Aperçu</Text><GlassCard><View className="flex-row items-center"><View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${color}20` }}>{React.createElement(getIcon(icon), { size: 24, color })}</View><Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '600' }}>{label || 'Nom de la catégorie'}</Text></View></GlassCard></View>
                {editingCategory && !editingCategory.isDefault ? <Button title="Supprimer cette catégorie" variant="danger" fullWidth onPress={handleDelete} icon={<Icons.Trash2 size={18} color="white" />} /> : null}
                <View className="h-12" />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
