// ============================================
// ONYX - Templates de transactions
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTemplateStore } from '@/stores';
import { useAccountStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES } from '@/types';
import { formatCurrency } from '@/utils/format';
import type { TransactionCategory } from '@/types';
import type { TransactionTemplate } from '@/types/template';

export default function TemplatesScreen() {
  const router = useRouter();
  const accounts = useAccountStore((s) => s.getActiveAccounts());
  const templates = useTemplateStore((s) => s.templates);
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const updateTemplate = useTemplateStore((s) => s.updateTemplate);
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<TransactionTemplate | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (accounts.length && !accountId) setAccountId(accounts[0].id);
  }, [accounts]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setType('expense');
    setCategory('other');
    setAccountId(accounts[0]?.id || '');
    setAmount('');
    setNote('');
    setModalVisible(true);
  };

  const openEdit = (t: TransactionTemplate) => {
    setEditing(t);
    setName(t.name);
    setType(t.type);
    setCategory(t.category);
    setAccountId(t.accountId);
    setAmount(t.amount != null ? String(t.amount) : '');
    setNote(t.note || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Nom du template requis');
      return;
    }
    if (!accountId) {
      Alert.alert('Erreur', 'Sélectionnez un compte');
      return;
    }
    const amountNum = amount.trim() ? parseFloat(amount.replace(',', '.')) : null;
    if (amount !== '' && (isNaN(amountNum!) || amountNum! < 0)) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }
    const data = {
      name: name.trim(),
      type,
      category,
      accountId,
      amount: amountNum,
      note: note.trim(),
    };
    if (editing) {
      updateTemplate(editing.id, data);
    } else {
      addTemplate(data);
    }
    setModalVisible(false);
  };

  const handleUseTemplate = (t: TransactionTemplate) => {
    router.back();
    router.push({
      pathname: '/transaction/add',
      params: {
        accountId: t.accountId,
        category: t.category,
        type: t.type,
        amount: t.amount ?? '',
        description: t.note,
      },
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer ce template ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteTemplate(id) },
    ]);
  };

  const expenseCategories = CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both');
  const incomeCategories = CATEGORIES.filter((c) => c.type === 'income' || c.type === 'both');
  const cats = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Templates</Text>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          <Text style={{ color: '#71717A', fontSize: 13, marginBottom: 16 }}>
            Créez des modèles pour enregistrer rapidement des transactions récurrentes.
          </Text>
          {templates.length === 0 ? (
            <EmptyState variant="no_templates" actionLabel="Créer un template" onAction={openAdd} />
          ) : (
            templates.map((t) => {
              const cat = CATEGORIES.find((c) => c.id === t.category);
              const acc = accounts.find((a) => a.id === t.accountId);
              return (
                <GlassCard key={t.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => handleUseTemplate(t)}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{t.name}</Text>
                      <Text style={{ color: '#71717A', fontSize: 12 }}>
                        {cat?.label} • {acc?.name} {t.amount != null ? `• ${formatCurrency(t.amount)}` : ''}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => openEdit(t)}>
                        <Icons.Pencil size={20} color="#6366F1" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(t.id)}>
                        <Icons.Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Button title="Utiliser" size="sm" variant="primary" onPress={() => handleUseTemplate(t)} style={{ marginTop: 12 }} />
                </GlassCard>
              );
            })
          )}
          <Button title="Créer un template" variant="secondary" fullWidth onPress={openAdd} style={{ marginTop: 16, marginBottom: 32 }} />
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <ScrollView style={{ maxHeight: '85%' }} showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: '#13131A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
                  {editing ? 'Modifier le template' : 'Nouveau template'}
                </Text>
                <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Nom</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Loyer"
                  placeholderTextColor="#52525B"
                  style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => setType('expense')}
                    style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: type === 'expense' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)' }}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Dépense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setType('income')}
                    style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: type === 'income' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)' }}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Revenu</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Catégorie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {cats.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setCategory(c.id as TransactionCategory)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                          backgroundColor: category === c.id ? c.color + '40' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 13 }}>{c.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Compte</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {accounts.map((a) => (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => setAccountId(a.id)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                          backgroundColor: accountId === a.id ? a.color + '40' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 13 }}>{a.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Montant (vide = variable)</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Ex: 750"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#52525B"
                  style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
                />
                <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Note (optionnel)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Description par défaut"
                  placeholderTextColor="#52525B"
                  style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 24 }}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                  <Button title="Enregistrer" variant="primary" style={{ flex: 1 }} onPress={handleSave} />
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
