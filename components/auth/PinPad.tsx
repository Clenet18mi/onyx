// ============================================
// ONYX - PIN Pad Component
// Clavier numérique pour saisie du PIN
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Delete, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(width * 0.22, 80);

interface PinPadProps {
  onNumberPress: (num: string) => void;
  onDeletePress: () => void;
  onBiometricPress?: () => void;
  showBiometric?: boolean;
  disabled?: boolean;
}

export function PinPad({
  onNumberPress,
  onDeletePress,
  onBiometricPress,
  showBiometric = false,
  disabled = false,
}: PinPadProps) {
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const { theme } = useTheme();
  const { colors } = theme;

  const handlePress = (callback: () => void) => {
    if (disabled) return;
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    callback();
  };

  const renderButton = (value: string | 'delete' | 'biometric', index: number) => {
    if (value === 'biometric') {
      if (!showBiometric) {
        return <View key={index} style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }} />;
      }
        return (
          <TouchableOpacity
          key={index}
          onPress={() => handlePress(() => onBiometricPress?.())}
          disabled={disabled}
          activeOpacity={0.7}
          className="items-center justify-center rounded-full"
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            backgroundColor: `${colors.accent.primary}20`,
          }}
        >
          <Fingerprint size={32} color={colors.accent.primary} />
        </TouchableOpacity>
      );
    }

    if (value === 'delete') {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(onDeletePress)}
          disabled={disabled}
          activeOpacity={0.7}
          className="items-center justify-center rounded-full"
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            backgroundColor: colors.background.secondary,
          }}
        >
          <Delete size={28} color={colors.text.secondary} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handlePress(() => onNumberPress(value))}
        disabled={disabled}
        activeOpacity={0.7}
        className="items-center justify-center rounded-full"
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          backgroundColor: colors.background.secondary,
        }}
      >
        <Text style={{ color: colors.text.primary, fontSize: 30, fontWeight: '600' }}>{value}</Text>
      </TouchableOpacity>
    );
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['biometric', '0', 'delete'],
  ];

  return (
    <View className="items-center">
      {buttons.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row mb-4" style={{ gap: 24 }}>
          {row.map((value, colIndex) => renderButton(value as any, rowIndex * 3 + colIndex))}
        </View>
      ))}
    </View>
  );
}
