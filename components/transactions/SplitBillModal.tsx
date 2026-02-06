// ============================================
// ONYX - Modal partage de dépense (Split Bill)
// ============================================

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useSplitStore } from '@/stores';
import { formatCurrency } from '@/utils/format';

export interface SplitBillModalProps {
  visible: boolean;
  onClose: () => void;
  transactionId: string;
  totalAmount: number;
  description?: string;
}

export function SplitBillModal({
  visible,
  onClose,
  transactionId,
  totalAmount,
  description,
}: SplitBillModalProps) {
  const createSplit = useSplitStore((s) => s.createSplit);
  const [namesInput, setNamesInput] = useState('');
  const [created, setCreated] = useState(false);

  const handleCreate = () => {
    const names = namesInput
      .split(/[,;\n]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length < 2) return;
    createSplit(transactionId, totalAmount, names, 'equal');
    setCreated(true);
  };

  const split = useSplitStore((s) => s.getSplitsByTransaction(transactionId));
  const participants = split?.participants ?? [];
  const amountEach = participants.length ? totalAmount / participants.length : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#13131A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Partager la dépense</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: '#6366F1' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#71717A', marginBottom: 4 }}>{formatCurrency(totalAmount)}</Text>
          {description ? <Text style={{ color: '#fff', marginBottom: 16 }}>{description}</Text> : null}

          {!created ? (
            <>
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>
                Noms des personnes (séparés par des virgules)
              </Text>
              <TextInput
                value={namesInput}
                onChangeText={setNamesInput}
                placeholder="Jean, Marie, Paul"
                placeholderTextColor="#52525B"
                style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
              />
              <Button
                title="Répartir équitablement"
                variant="primary"
                fullWidth
                onPress={handleCreate}
                disabled={namesInput.split(/[,;\n]/).filter((n) => n.trim()).length < 2}
              />
            </>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {participants.map((p) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ color: '#fff' }}>{p.name}</Text>
                  <Text style={{ color: p.paid ? '#10B981' : '#6366F1' }}>
                    {formatCurrency(p.amount)} {p.paid ? '✓' : ''}
                  </Text>
                </View>
              ))}
              <Text style={{ color: '#71717A', fontSize: 12, marginTop: 12 }}>
                Chacun doit : {formatCurrency(amountEach)}
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
