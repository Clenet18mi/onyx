// ============================================
// ONYX - Calculatrice intégrée
// Overlay pour champ montant (+, -, *, /, %)
// ============================================

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { hapticLight } from '@/utils/haptics';
import { useSettingsStore } from '@/stores';

const BUTTONS = [
  ['C', '⌫', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['.', '0', '', '='],
];

export interface CalculatorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue?: string;
}

function safeEval(expr: string): number | null {
  try {
    const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
    if (!/^[\d\s+\-*/.()%]+$/.test(cleaned)) return null;
    const result = Function(`"use strict"; return (${cleaned})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function Calculator({ visible, onClose, onConfirm, initialValue = '' }: CalculatorProps) {
  const { theme } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const [expression, setExpression] = useState(initialValue || '');
  const [result, setResult] = useState<number | null>(null);

  const handlePress = useCallback(
    (key: string) => {
      if (hapticEnabled) hapticLight();

      if (key === 'C') {
        setExpression('');
        setResult(null);
        return;
      }
      if (key === '⌫') {
        setExpression((e) => e.slice(0, -1));
        setResult(null);
        return;
      }
      if (key === '=') {
        const val = safeEval(expression);
        if (val != null) {
          setResult(val);
          setExpression(String(val));
        }
        return;
      }

      setExpression((e) => {
        const next = e + key;
        const val = safeEval(next);
        setResult(val);
        return next;
      });
    },
    [expression, hapticEnabled]
  );

  const handleConfirm = () => {
    const val = result != null ? result : safeEval(expression);
    if (val != null) onConfirm(val);
    onClose();
  };

  const colors = theme.colors;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor: colors.background.secondary }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.display, { backgroundColor: colors.background.tertiary }]}>
            <Text style={[styles.expression, { color: colors.text.tertiary }]} numberOfLines={1}>
              {expression || '0'}
            </Text>
            <Text style={[styles.result, { color: colors.text.primary }]}>
              {result != null ? result.toFixed(2) : expression ? '=' : ''}
            </Text>
          </View>
          <View style={styles.grid}>
            {BUTTONS.flat().map((key, i) => {
              if (key === '') return <View key={`empty-${i}`} style={styles.btn} />;
              const isOp = ['%', '/', '*', '-', '+', '='].includes(key);
              const isZero = key === '0';
              return (
                <TouchableOpacity
                  key={`${key}-${i}`}
                  style={[
                    styles.btn,
                    isZero && styles.btnZero,
                    isOp && { backgroundColor: colors.accent.primary + '30' },
                  ]}
                  onPress={() => handlePress(key)}
                >
                  <Text style={[styles.btnText, { color: colors.text.primary }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.accent.primary }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmText}>Valider</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 40,
  },
  display: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  expression: { fontSize: 18 },
  result: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  btn: {
    width: '22%',
    aspectRatio: 1.2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnZero: { width: '48%' },
  btnText: { fontSize: 22, fontWeight: '600' },
  confirmBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
