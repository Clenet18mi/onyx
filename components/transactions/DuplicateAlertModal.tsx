// ============================================
// ONYX - Modal alerte doublon
// "Cette transaction ressemble à une déjà enregistrée"
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DuplicateMatch } from '@/utils/duplicateDetector';
import type { DuplicateCandidate } from '@/utils/duplicateDetector';
import { CATEGORIES } from '@/types';

export interface DuplicateAlertModalProps {
  visible: boolean;
  candidate: DuplicateCandidate;
  matches: DuplicateMatch[];
  onConfirmAdd: () => void;
  onCancel: () => void;
  onViewTransaction: (transactionId: string) => void;
  onDontAlertAgain: () => void;
}

export function DuplicateAlertModal({
  visible,
  candidate,
  matches,
  onConfirmAdd,
  onCancel,
  onViewTransaction,
  onDontAlertAgain,
}: DuplicateAlertModalProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const categoryLabel = CATEGORIES.find((c) => c.id === candidate.category)?.label ?? candidate.category;

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      size="md"
      title="Transaction similaire ?"
      dismissOnBackdrop
      footer={
        <View style={{ gap: 12 }}>
          <Button
            title="C'est différent, enregistrer"
            variant="primary"
            fullWidth
            onPress={onConfirmAdd}
          />
          <Button title="C'est un doublon (annuler)" variant="ghost" fullWidth onPress={onCancel} />
          <TouchableOpacity onPress={onDontAlertAgain} style={{ paddingVertical: 8, alignSelf: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
              Ne plus alerter pour ce type de transaction
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>
        Une transaction très similaire a été enregistrée récemment :
      </Text>

      <View style={{ marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: colors.background.tertiary }}>
        <Text style={{ color: colors.text.primary, fontWeight: '600', marginBottom: 4 }}>
          Ta saisie : {candidate.type === 'expense' ? '-' : '+'}
          {formatCurrency(candidate.amount)} • {categoryLabel}
        </Text>
        {candidate.description ? (
          <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>{candidate.description}</Text>
        ) : null}
      </View>

      <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Transaction(s) proche(s) :</Text>
      <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
        {matches.slice(0, 3).map((m) => (
          <TouchableOpacity
            key={m.transaction.id}
            onPress={() => onViewTransaction(m.transaction.id)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: colors.background.tertiary,
              marginBottom: 8,
            }}
          >
            <View>
              <Text style={{ color: colors.text.primary, fontWeight: '500' }}>
                {m.transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(m.transaction.amount)}
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                {format(parseISO(m.transaction.date), "d MMM yyyy, HH:mm", { locale: fr })} • {m.score}% similaire
              </Text>
            </View>
            <Text style={{ color: colors.accent.primary, fontSize: 13 }}>Voir →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Modal>
  );
}
