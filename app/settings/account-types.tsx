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
import { useTheme } from '@/hooks/useTheme';

const ACCOUNT_ICONS = ['Wallet','PiggyBank','Banknote','TrendingUp','Bitcoin','Building','CreditCard','Landmark','Coins','DollarSign','Euro','Briefcase','Home','Car','ShoppingBag','Globe','Gem','Crown','Gift','CircleDollarSign'];

export default function AccountTypesSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<CustomAccountType | null>(null);
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [defaultColor, setDefaultColor] = useState(AVAILABLE_COLORS[0]);

  const { accountTypes, addAccountType, updateAccountType, deleteAccountType, toggleAccountTypeVisibility, resetAccountTypesToDefault } = useConfigStore();
  const sortedTypes = [...accountTypes].sort((a, b) => a.order - b.order);
  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.Wallet;
  const resetForm = () => { setLabel(''); setIcon('Wallet'); setDefaultColor(AVAILABLE_COLORS[0]); setEditingType(null); };
  const openAddModal = () => { resetForm(); setModalVisible(true); };
  const openEditModal = (accountType: CustomAccountType) => { setEditingType(accountType); setLabel(accountType.label); setIcon(accountType.icon); setDefaultColor(accountType.defaultColor); setModalVisible(true); };
  const handleSave = () => { if (!label.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; } if (editingType) updateAccountType(editingType.id, { label: label.trim(), icon, defaultColor }); else addAccountType({ label: label.trim(), icon, defaultColor, isHidden: false }); setModalVisible(false); resetForm(); };
  const handleDelete = () => { if (!editingType) return; if (editingType.isDefault) { Alert.alert('Impossible', 'Les types par défaut ne peuvent pas être supprimés, mais vous pouvez les masquer.'); return; } Alert.alert('Supprimer le type', `Voulez-vous supprimer "${editingType.label}" ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => { deleteAccountType(editingType.id); setModalVisible(false); resetForm(); } }]); };
  const handleReset = () => { Alert.alert('Réinitialiser', 'Voulez-vous restaurer les types de comptes par défaut ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Réinitialiser', style: 'destructive', onPress: resetAccountTypesToDefault }]); };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.ChevronLeft size={24} color={colors.text.primary} /></TouchableOpacity>
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>Types de Comptes</Text>
          </View>
          <TouchableOpacity onPress={openAddModal}><Icons.Plus size={24} color={colors.accent.primary} /></TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {sortedTypes.map((accountType) => { const Icon = getIcon(accountType.icon); return (<TouchableOpacity key={accountType.id} onPress={() => openEditModal(accountType)} className="mb-2"><GlassCard><View className="flex-row items-center"><View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${accountType.defaultColor}20`, opacity: accountType.isHidden ? 0.5 : 1 }}><Icon size={20} color={accountType.defaultColor} /></View><View className="flex-1" style={{ opacity: accountType.isHidden ? 0.5 : 1 }}><Text style={{ color: colors.text.primary, fontWeight: '600' }}>{accountType.label}</Text>{accountType.isDefault ? <Text className="text-sm" style={{ color: colors.text.secondary }}>Par défaut</Text> : null}</View><Switch value={!accountType.isHidden} onValueChange={() => toggleAccountTypeVisibility(accountType.id)} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} /></View></GlassCard></TouchableOpacity>); })}
          <TouchableOpacity onPress={handleReset} className="mt-4 mb-8 p-4 rounded-xl items-center" style={{ backgroundColor: `${colors.accent.danger}12`, borderWidth: 1, borderColor: `${colors.accent.danger}20` }}><Text style={{ color: colors.accent.danger, fontWeight: '600' }}>Restaurer les types par défaut</Text></TouchableOpacity>
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1" style={{ backgroundColor: colors.background.primary }}>
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.text.secondary }}>Annuler</Text></TouchableOpacity>
                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>{editingType ? 'Modifier' : 'Nouveau Type'}</Text>
                <TouchableOpacity onPress={handleSave}><Text style={{ color: colors.accent.primary, fontWeight: '700' }}>Enregistrer</Text></TouchableOpacity>
              </View>
              <ScrollView className="flex-1 px-6 py-4">
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Nom du type de compte</Text><TextInput value={label} onChangeText={setLabel} placeholder="Ex: Compte Joint" placeholderTextColor={colors.text.tertiary} className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} /></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Icône</Text><View className="flex-row flex-wrap" style={{ gap: 10 }}>{ACCOUNT_ICONS.map((iconName) => { const IconComp = getIcon(iconName); return (<TouchableOpacity key={iconName} onPress={() => setIcon(iconName)} className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: icon === iconName ? `${colors.accent.primary}20` : colors.background.secondary, borderWidth: 1, borderColor: icon === iconName ? colors.accent.primary : colors.background.tertiary }}><IconComp size={22} color={icon === iconName ? colors.accent.primary : colors.text.secondary} /></TouchableOpacity>); })}</View></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Couleur par défaut</Text><View className="flex-row flex-wrap" style={{ gap: 12 }}>{AVAILABLE_COLORS.map((c) => (<TouchableOpacity key={c} onPress={() => setDefaultColor(c)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: c, borderWidth: defaultColor === c ? 2 : 1, borderColor: defaultColor === c ? '#fff' : colors.background.tertiary }}>{defaultColor === c && <Icons.Check size={20} color="white" />}</TouchableOpacity>))}</View></View>
                <View className="mb-6"><Text className="text-sm mb-2" style={{ color: colors.text.secondary }}>Aperçu</Text><GlassCard><View className="flex-row items-center"><View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${defaultColor}20` }}>{React.createElement(getIcon(icon), { size: 24, color: defaultColor })}</View><Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '600' }}>{label || 'Type de compte'}</Text></View></GlassCard></View>
                {editingType && !editingType.isDefault ? <Button title="Supprimer ce type" variant="danger" fullWidth onPress={handleDelete} icon={<Icons.Trash2 size={18} color="white" />} /> : null}
                <View className="h-12" />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
