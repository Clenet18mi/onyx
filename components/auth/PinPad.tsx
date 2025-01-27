// ============================================
// ONYX - PIN Pad Component
// Clavier numérique pour saisie du PIN
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Delete, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';

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
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
          }}
        >
          <Fingerprint size={32} color="#6366F1" />
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
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Delete size={28} color="#71717A" />
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
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <Text className="text-white text-3xl font-semibold">{value}</Text>
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
