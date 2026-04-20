// ============================================
// ONYX - More Screen
// Menu : abonnements, outils, paramètres (export/import dans Gestion des données)
// ============================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Icons from 'lucide-react-native';
import { useAuthStore, useSettingsStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';

export default function MoreScreen() {
  const router = useRouter();
  const { lock, biometricEnabled, enableBiometric } = useAuthStore();
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const toggleHaptic = useSettingsStore((state) => state.toggleHaptic);

  const handleLock = () => {
    Alert.alert(
      'Verrouiller ONYX',
      'Voulez-vous verrouiller l\'application ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Verrouiller', onPress: () => lock() },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-white text-2xl font-bold">Plus</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Paramètres */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Paramètres</Text>
            
            <GlassCard noPadding>
              <TouchableOpacity
                onPress={toggleHaptic}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.Vibrate size={20} color="#71717A" />
                  <Text className="text-white ml-3">Retour haptique</Text>
                </View>
                <Switch
                  value={hapticEnabled}
                  onValueChange={toggleHaptic}
                  trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => enableBiometric(!biometricEnabled)}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.Fingerprint size={20} color="#71717A" />
                  <Text className="text-white ml-3">Biométrie</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={(v) => enableBiometric(v)}
                  trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
              >
                <View className="flex-row items-center">
                  <Icons.Settings size={20} color="#71717A" />
                  <Text className="text-white ml-3">Tous les paramètres</Text>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleLock}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center">
                  <Icons.Lock size={20} color="#71717A" />
                  <Text className="text-white ml-3">Verrouiller</Text>
                </View>
                <Icons.ChevronRight size={20} color="#52525B" />
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* À propos */}
          <View className="mb-6 items-center py-8">
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
            >
              <Icons.Shield size={32} color="#6366F1" />
            </View>
            <Text className="text-white text-xl font-bold">ONYX</Text>
            <Text className="text-onyx-500 text-sm">Version 1.0.0</Text>
            <Text className="text-onyx-500 text-sm mt-2">100% Offline · Vos données restent privées</Text>
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
