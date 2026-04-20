import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function SplashLoader() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background.primary }}>
      <View className="items-center">
        <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: `${colors.accent.primary}18` }}>
          <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>O</Text>
        </View>
        <Text style={{ color: colors.text.primary, fontSize: 34, fontWeight: '700', letterSpacing: 1 }}>ONYX</Text>
        <Text style={{ color: colors.text.secondary, marginTop: 6, marginBottom: 20 }}>Chargement sécurisé</Text>
        <ActivityIndicator size="small" color={colors.accent.primary} />
      </View>
    </View>
  );
}
