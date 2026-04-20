import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAuthStore, useSettingsStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/useTheme';

function MoreRow({ icon, label, onPress, rightElement }: { icon: React.ReactNode; label: string; onPress?: () => void; rightElement?: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.background.tertiary }}>
      <View className="flex-row items-center flex-1">
        {icon}
        <View className="ml-3 flex-1">
          <Text className="font-medium" style={{ color: theme.colors.text.primary }}>{label}</Text>
          <Text className="text-xs mt-0.5" style={{ color: theme.colors.text.secondary }}>{onPress ? 'Ouvrir le détail' : 'Activer ou désactiver'}</Text>
        </View>
      </View>
      {rightElement || (onPress ? <Icons.ChevronRight size={20} color={theme.colors.text.tertiary} /> : null)}
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const { lock, biometricEnabled, enableBiometric } = useAuthStore();
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const toggleHaptic = useSettingsStore((state) => state.toggleHaptic);

  const handleLock = () => {
    Alert.alert('Verrouiller ONYX', 'Voulez-vous verrouiller l\'application ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Verrouiller', onPress: () => lock() },
    ]);
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 py-4">
          <Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700' }}>Plus</Text>
          <Text style={{ color: colors.text.secondary, marginTop: 4 }}>Réglages rapides et accès système</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Paramètres</Text>
            <GlassCard noPadding>
              <MoreRow
                icon={<Icons.Vibrate size={20} color={colors.text.secondary} />}
                label="Retour haptique"
                rightElement={<Switch value={hapticEnabled} onValueChange={toggleHaptic} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} />}
              />
              <MoreRow
                icon={<Icons.Fingerprint size={20} color={colors.text.secondary} />}
                label="Biométrie"
                rightElement={<Switch value={biometricEnabled} onValueChange={(v) => enableBiometric(v)} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} />}
              />
              <MoreRow
                icon={<Icons.Settings size={20} color={colors.text.secondary} />}
                label="Tous les paramètres"
                onPress={() => router.push('/settings')}
              />
              <MoreRow
                icon={<Icons.Lock size={20} color={colors.text.secondary} />}
                label="Verrouiller"
                onPress={handleLock}
              />
            </GlassCard>
          </View>

          <View className="mb-6 items-center py-8">
            <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: `${colors.accent.primary}22`, borderWidth: 1, borderColor: `${colors.accent.primary}24` }}>
              <Icons.Shield size={32} color={colors.accent.primary} />
            </View>
            <Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '700' }}>ONYX</Text>
            <Text style={{ color: colors.text.secondary, fontSize: 13 }}>Version 1.0.0</Text>
            <Text className="text-sm mt-2 text-center" style={{ color: colors.text.secondary }}>100% Offline · Vos données restent privées</Text>
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
