// ============================================
// ONYX - Règles d'automatisation
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAutomationStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES } from '@/types';
import type { AutomationRule, Trigger, Action } from '@/types/automation';

export default function AutomationRulesScreen() {
  const router = useRouter();
  const rules = useAutomationStore((s) => s.rules);
  const addRule = useAutomationStore((s) => s.addRule);
  const updateRule = useAutomationStore((s) => s.updateRule);
  const deleteRule = useAutomationStore((s) => s.deleteRule);
  const toggleRule = useAutomationStore((s) => s.toggleRule);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [name, setName] = useState('');
  const [triggerNoteContains, setTriggerNoteContains] = useState('');
  const [actionCategory, setActionCategory] = useState('other');

  const openAdd = () => {
    setEditingRule(null);
    setName('');
    setTriggerNoteContains('');
    setActionCategory('other');
    setModalVisible(true);
  };

  const openEdit = (r: AutomationRule) => {
    setEditingRule(r);
    setName(r.name);
    const noteTrigger = r.triggers.find((t) => t.type === 'note_contains');
    setTriggerNoteContains((noteTrigger?.value as string) || '');
    const catAction = r.actions.find((a) => a.type === 'set_category');
    setActionCategory((catAction?.value as string) || 'other');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Nom de la règle requis');
      return;
    }
    if (!triggerNoteContains.trim()) {
      Alert.alert('Erreur', 'Indiquez le texte à détecter dans la note');
      return;
    }
    const triggers: Trigger[] = [{ type: 'note_contains', value: triggerNoteContains.trim() }];
    const actions: Action[] = [{ type: 'set_category', value: actionCategory }];
    const priority = rules.length;

    if (editingRule) {
      updateRule(editingRule.id, { name: name.trim(), triggers, actions });
    } else {
      addRule({ name: name.trim(), enabled: true, priority, triggers, actions });
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette règle ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteRule(id) },
    ]);
  };

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Règles automatiques</Text>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          <Text style={{ color: '#71717A', fontSize: 13, marginBottom: 16 }}>
            Si la note contient un texte → alors assigner une catégorie.
          </Text>
          {rules.length === 0 ? (
            <EmptyState variant="no_templates" actionLabel="Créer une règle" onAction={openAdd} />
          ) : (
            rules.map((r) => {
              const noteVal = r.triggers.find((t) => t.type === 'note_contains')?.value as string;
              const catVal = r.actions.find((a) => a.type === 'set_category')?.value as string;
              const catLabel = CATEGORIES.find((c) => c.id === catVal)?.label ?? catVal;
              return (
                <GlassCard key={r.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openEdit(r)}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{r.name}</Text>
                      <Text style={{ color: '#71717A', fontSize: 12 }}>
                        Si note contient « {noteVal} » → {catLabel}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => toggleRule(r.id)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: r.enabled ? 'rgba(16,185,129,0.2)' : 'rgba(113,113,122,0.2)',
                        }}
                      >
                        <Text style={{ color: r.enabled ? '#10B981' : '#71717A', fontSize: 12 }}>
                          {r.enabled ? 'On' : 'Off'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(r.id)}>
                        <Icons.Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              );
            })
          )}
          <Button title="Ajouter une règle" variant="secondary" fullWidth onPress={openAdd} style={{ marginTop: 16, marginBottom: 32 }} />
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#13131A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle'}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Nom</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Spotify → Abonnements"
                placeholderTextColor="#52525B"
                style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
              />
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Si la note contient (texte)</Text>
              <TextInput
                value={triggerNoteContains}
                onChangeText={setTriggerNoteContains}
                placeholder="Ex: Spotify, Netflix"
                placeholderTextColor="#52525B"
                style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
              />
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Alors catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both').map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setActionCategory(c.id)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: actionCategory === c.id ? c.color + '40' : 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        borderColor: actionCategory === c.id ? c.color : 'transparent',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 13 }}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                <Button title="Enregistrer" variant="primary" style={{ flex: 1 }} onPress={handleSave} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
