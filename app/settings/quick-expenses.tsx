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
import { useTheme } from '@/hooks/useTheme';

const QUICK_ICONS = ['Coffee','UtensilsCrossed','Train','ShoppingCart','Fuel','Ticket','Beer','Pizza','Bus','Car','Bike','Plane','Popcorn','Music','Dumbbell','ShoppingBag','Pill','Book','Gamepad2','Film','Gift','Phone','Wifi','Zap'];

export default function QuickExpensesSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickExpenseTemplate | null>(null);
  const [name, setName] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [icon, setIcon] = useState('Coffee');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [categoryId, setCategoryId] = useState('food');

  const { quickExpenses, categories, addQuickExpense, updateQuickExpense, deleteQuickExpense, toggleQuickExpenseActive, resetQuickExpensesToDefault } = useConfigStore();
  const sortedTemplates = [...quickExpenses].sort((a, b) => a.order - b.order);
  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  const resetForm = () => { setName(''); setDefaultAmount(''); setIcon('Coffee'); setColor(AVAILABLE_COLORS[0]); setCategoryId('food'); setEditingTemplate(null); };
  const openAddModal = () => { resetForm(); setModalVisible(true); };
  const openEditModal = (template: QuickExpenseTemplate) => { setEditingTemplate(template); setName(template.name); setDefaultAmount(template.defaultAmount?.toString() || ''); setIcon(template.icon); setColor(template.color); setCategoryId(template.categoryId); setModalVisible(true); };
  const handleSave = () => { if (!name.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; } const templateData = { name: name.trim(), defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined, icon, color, categoryId, isActive: true }; if (editingTemplate) updateQuickExpense(editingTemplate.id, templateData); else addQuickExpense(templateData); setModalVisible(false); resetForm(); };
  const handleDelete = () => { if (!editingTemplate) return; Alert.alert('Supprimer', `Voulez-vous supprimer "${editingTemplate.name}" ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => { deleteQuickExpense(editingTemplate.id); setModalVisible(false); resetForm(); } }]); };
  const handleReset = () => { Alert.alert('Réinitialiser', 'Voulez-vous restaurer les dépenses rapides par défaut ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Réinitialiser', style: 'destructive', onPress: resetQuickExpensesToDefault }]); };
  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.CircleDot;

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.ChevronLeft size={24} color={colors.text.primary} /></TouchableOpacity>
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>Dépenses Rapides</Text>
          </View>
          <TouchableOpacity onPress={openAddModal}><Icons.Plus size={24} color={colors.accent.primary} /></TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Text className="text-sm mb-4" style={{ color: colors.text.secondary }}>Gère les dépenses rapides utilisées dans l'ajout de transaction.</Text>
          {sortedTemplates.map((template) => { const Icon = getIcon(template.icon); const category = categories.find(c => c.id === template.categoryId); return (<TouchableOpacity key={template.id} onPress={() => openEditModal(template)} className="mb-2"><GlassCard><View className="flex-row items-center"><View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${template.color}20`, opacity: template.isActive ? 1 : 0.5 }}><Icon size={20} color={template.color} /></View><View className="flex-1" style={{ opacity: template.isActive ? 1 : 0.5 }}><Text style={{ color: colors.text.primary, fontWeight: '600' }}>{template.name}</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>{category?.label || 'Catégorie'}{template.defaultAmount && ` • ${formatCurrency(template.defaultAmount)}`}</Text></View><Switch value={template.isActive} onValueChange={() => toggleQuickExpenseActive(template.id)} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} /></View></GlassCard></TouchableOpacity>); })}
          <TouchableOpacity onPress={handleReset} className="mt-4 mb-8 p-4 rounded-xl items-center" style={{ backgroundColor: `${colors.accent.danger}12`, borderWidth: 1, borderColor: `${colors.accent.danger}20` }}><Text style={{ color: colors.accent.danger, fontWeight: '600' }}>Restaurer les dépenses par défaut</Text></TouchableOpacity>
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1" style={{ backgroundColor: colors.background.primary }}>
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.text.secondary }}>Annuler</Text></TouchableOpacity>
                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>{editingTemplate ? 'Modifier' : 'Nouvelle Dépense Rapide'}</Text>
                <TouchableOpacity onPress={handleSave}><Text style={{ color: colors.accent.primary, fontWeight: '700' }}>Enregistrer</Text></TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-4">
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Nom</Text><TextInput value={name} onChangeText={setName} placeholder="Ex: Café, Métro, Boulangerie..." placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Montant par défaut (optionnel)</Text><TextInput value={defaultAmount} onChangeText={setDefaultAmount} placeholder="Ex: 3.50" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Catégorie</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View className="flex-row" style={{ gap: 8 }}>{expenseCategories.map((cat) => { const CatIcon = getIcon(cat.icon); const isSelected = categoryId === cat.id; return (<TouchableOpacity key={cat.id} onPress={() => setCategoryId(cat.id)} className="px-3 py-2 rounded-xl flex-row items-center" style={{ backgroundColor: isSelected ? `${cat.color}20` : colors.background.secondary, borderWidth: 1, borderColor: isSelected ? cat.color : colors.background.tertiary }}><CatIcon size={16} color={isSelected ? cat.color : colors.text.secondary} /><Text className="ml-2 text-sm" style={{ color: isSelected ? colors.text.primary : colors.text.secondary }}>{cat.label}</Text></TouchableOpacity>); })}</View></ScrollView></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Icône</Text><View className="flex-row flex-wrap" style={{ gap: 10 }}>{QUICK_ICONS.map((iconName) => { const IconComp = getIcon(iconName); return (<TouchableOpacity key={iconName} onPress={() => setIcon(iconName)} className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: icon === iconName ? `${colors.accent.primary}20` : colors.background.secondary, borderWidth: 1, borderColor: icon === iconName ? colors.accent.primary : colors.background.tertiary }}><IconComp size={22} color={icon === iconName ? colors.accent.primary : colors.text.secondary} /></TouchableOpacity>); })}</View></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Couleur</Text><View className="flex-row flex-wrap" style={{ gap: 12 }}>{AVAILABLE_COLORS.map((c) => (<TouchableOpacity key={c} onPress={() => setColor(c)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: c, borderWidth: color === c ? 2 : 1, borderColor: color === c ? '#fff' : colors.background.tertiary }}>{color === c && <Icons.Check size={20} color="white" />}</TouchableOpacity>))}</View></View>
                {editingTemplate ? <Button title="Supprimer" variant="danger" fullWidth onPress={handleDelete} icon={<Icons.Trash2 size={18} color="white" />} /> : null}
                <View className="h-12" />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
