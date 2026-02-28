// ============================================
// ONYX - Splash Loader
// Affiché pendant la réhydratation des stores
// ============================================

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export function SplashLoader() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: '#0A0A0B' }}
    >
      <Text className="text-white text-3xl font-bold mb-8">ONYX</Text>
      <ActivityIndicator size="small" color="#6366F1" />
    </View>
  );
}
