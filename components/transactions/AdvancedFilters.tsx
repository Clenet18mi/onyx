// ============================================
// ONYX - Filtres avancés (modal)
// ============================================

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useFilterStore } from '@/stores';
import { useAccountStore } from '@/stores';
import { CATEGORIES } from '@/types';
import type { PeriodPreset, SavedFilter } from '@/types/filter';
import type { TransactionCategory } from '@/types';

const PERIODS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: '30 jours' },
  { value: '3months', label: '3 mois' },
  { value: '6months', label: '6 mois' },
  { value: 'year', label: 'Année' },
];

export interface AdvancedFiltersProps {
  visible: boolean;
  onClose: () => void;
}

export function AdvancedFilters({ visible, onClose }: AdvancedFiltersProps) {
  const activeFilter = useFilterStore((s) => s.activeFilter);
  const setActiveFilter = useFilterStore((s) => s.setActiveFilter);
  const savedFilters = useFilterStore((s) => s.savedFilters);
  const addFilter = useFilterStore((s) => s.addFilter);

  const [period, setPeriod] = useState<PeriodPreset>(activeFilter?.period || 'month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>(activeFilter?.types?.length === 1 ? activeFilter.types[0] : 'all');
  const [searchQuery, setSearchQuery] = useState(activeFilter?.searchQuery || '');
  const [saveName, setSaveName] = useState('');

  const handleApply = () => {
    const types: ('income' | 'expense' | 'transfer')[] =
      typeFilter === 'all' ? ['income', 'expense', 'transfer'] : [typeFilter];
    setActiveFilter({
      period,
      types,
      searchQuery: searchQuery.trim(),
      accountIds: activeFilter?.accountIds ?? [],
      categoryIds: activeFilter?.categoryIds ?? [],
      sortBy: activeFilter?.sortBy ?? 'date',
      sortOrder: activeFilter?.sortOrder ?? 'desc',
    });
    onClose();
  };

  const handleClear = () => {
    setActiveFilter(null);
    setPeriod('month');
    setTypeFilter('all');
    setSearchQuery('');
    onClose();
  };

  const handleSaveFavorite = () => {
    if (!saveName.trim()) return;
    const types: ('income' | 'expense' | 'transfer')[] =
      typeFilter === 'all' ? ['income', 'expense', 'transfer'] : [typeFilter];
    addFilter({
      name: saveName.trim(),
      period,
      types,
      searchQuery: searchQuery.trim(),
      accountIds: [],
      categoryIds: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setSaveName('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#13131A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Filtres</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: '#6366F1' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>Période</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPeriod(p.value)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: period === p.value ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13 }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {(['all', 'income', 'expense', 'transfer'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTypeFilter(t)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: typeFilter === t ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13 }}>{t === 'all' ? 'Tous' : t === 'income' ? 'Revenus' : t === 'expense' ? 'Dépenses' : 'Virements'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>Recherche (note, description)</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Texte à chercher..."
              placeholderTextColor="#52525B"
              style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <Button title="Effacer" variant="ghost" style={{ flex: 1 }} onPress={handleClear} />
              <Button title="Appliquer" variant="primary" style={{ flex: 1 }} onPress={handleApply} />
            </View>
            <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>Sauvegarder ce filtre</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={saveName}
                onChangeText={setSaveName}
                placeholder="Nom du filtre"
                placeholderTextColor="#52525B"
                style={{ flex: 1, backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff' }}
              />
              <Button title="Sauver" size="sm" variant="secondary" onPress={handleSaveFavorite} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
