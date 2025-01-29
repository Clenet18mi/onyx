// ============================================
// ONYX - Quick Actions Component
// Boutons d'action rapide améliorés
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  ArrowLeftRight, 
  Banknote,
  PiggyBank,
  Receipt,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
  highlight?: boolean;
}

function ActionButton({ icon, label, color, onPress, highlight }: ActionButtonProps) {
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  const handlePress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="items-center"
      activeOpacity={0.7}
    >
      <View 
        className={`w-14 h-14 rounded-2xl items-center justify-center mb-2 ${highlight ? 'border-2' : ''}`}
        style={{ 
          backgroundColor: `${color}20`,
          borderColor: highlight ? color : 'transparent',
        }}
      >
        {icon}
      </View>
      <Text className="text-onyx-500 text-xs font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

interface QuickActionsProps {
  onPayday?: () => void;
}

export function QuickActions({ onPayday }: QuickActionsProps) {
  const router = useRouter();

  return (
    <View className="flex-row justify-around py-4 mb-6">
      <ActionButton
        icon={<Plus size={24} color="#10B981" />}
        label="Ajouter"
        color="#10B981"
        onPress={() => router.push('/transaction/add')}
      />
      
      {onPayday && (
        <ActionButton
          icon={<Banknote size={24} color="#F59E0B" />}
          label="Salaire"
          color="#F59E0B"
          onPress={onPayday}
          highlight
        />
      )}
      
      <ActionButton
        icon={<ArrowLeftRight size={24} color="#6366F1" />}
        label="Virement"
        color="#6366F1"
        onPress={() => router.push('/transfer')}
      />
      
      <ActionButton
        icon={<PiggyBank size={24} color="#EC4899" />}
        label="Épargner"
        color="#EC4899"
        onPress={() => router.push('/goals')}
      />
    </View>
  );
}
