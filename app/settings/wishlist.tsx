// ============================================
// ONYX - Liste d'envies (Wishlist)
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWishlistStore } from '@/stores';
import { formatCurrency } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { WishlistItem } from '@/types/wishlist';

const PRIORITIES = [1, 2, 3, 4, 5] as const;

export default function WishlistScreen() {
  const router = useRouter();
  const items = useWishlistStore((s) => s.items).filter((i) => !i.purchasedAt);
  const addItem = useWishlistStore((s) => s.addItem);
  const updateItem = useWishlistStore((s) => s.updateItem);
  const deleteItem = useWishlistStore((s) => s.deleteItem);
  const markPurchased = useWishlistStore((s) => s.markPurchased);
  const getTotalValue = useWishlistStore((s) => s.getTotalValue);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState('');

  const openAdd = () => {
    setEditingItem(null);
    setName('');
    setPrice('');
    setPriority(3);
    setNotes('');
    setModalVisible(true);
  };

  const openEdit = (i: WishlistItem) => {
    setEditingItem(i);
    setName(i.name);
    setPrice(i.price.toString());
    setPriority(i.priority);
    setNotes(i.notes || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Nom requis');
      return;
    }
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Erreur', 'Prix invalide');
      return;
    }
    if (editingItem) {
      updateItem(editingItem.id, { name: name.trim(), price: priceNum, priority, notes: notes.trim() || undefined });
    } else {
      addItem({ name: name.trim(), price: priceNum, priority, notes: notes.trim() || undefined });
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Retirer cet article de la liste ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteItem(id) },
    ]);
  };

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Liste d'envies</Text>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          {items.length === 0 ? (
            <EmptyState variant="no_wishlist" actionLabel="Ajouter un article" onAction={openAdd} />
          ) : (
            <>
              <View style={{ marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.15)' }}>
                <Text style={{ color: '#A8A8B3', fontSize: 12 }}>Total liste</Text>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{formatCurrency(getTotalValue())}</Text>
              </View>
              {items.map((i) => (
                <GlassCard key={i.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openEdit(i)}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{i.name}</Text>
                      <Text style={{ color: '#71717A', fontSize: 12 }}>{'★'.repeat(i.priority)} Priorité</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ color: '#6366F1', fontWeight: '600' }}>{formatCurrency(i.price)}</Text>
                      <TouchableOpacity onPress={() => markPurchased(i.id)} style={{ padding: 4 }}>
                        <Icons.Check size={22} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(i.id)}>
                        <Icons.Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              ))}
              <Button title="Ajouter un article" variant="secondary" fullWidth onPress={openAdd} style={{ marginTop: 8, marginBottom: 32 }} />
            </>
          )}
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#13131A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
                {editingItem ? 'Modifier' : 'Nouvel article'}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Nom</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Nouveau téléphone"
                placeholderTextColor="#52525B"
                style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
              />
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Prix (€)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="99.99"
                keyboardType="decimal-pad"
                placeholderTextColor="#52525B"
                style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
              />
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>Priorité (1-5 étoiles)</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: priority === p ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 16 }}>{'★'.repeat(p)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Notes (optionnel)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Lien, détails..."
                placeholderTextColor="#52525B"
                style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 24 }}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                <Button title={editingItem ? 'Enregistrer' : 'Ajouter'} variant="primary" style={{ flex: 1 }} onPress={handleSave} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
