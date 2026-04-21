import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import Constants from 'expo-constants';
import { useAuthStore, useSettingsStore, useConfigStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/useTheme';

const changelogMeta = require('@/constants/changelog.json') as { appVersion: string; buildNumber: string };

function getAppVersion(): string {
  const v = Constants.expoConfig?.version ?? changelogMeta?.appVersion ?? '1.0.0';
  const build = changelogMeta?.buildNumber;
  return build ? `${v} (${build})` : v;
}

function SectionTitle({ children }: { children: string }) {
  const { theme } = useTheme();
  return (
    <Text className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: theme.colors.text.secondary }}>
      {children}
    </Text>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({ icon, label, sublabel, onPress, rightElement, danger }: SettingsItemProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      className="flex-row items-center justify-between px-4 py-4"
      activeOpacity={0.7}
      style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}
    >
      <View className="flex-row items-center flex-1">
        {icon}
        <View className="ml-3 flex-1">
          <Text style={{ color: danger ? colors.accent.danger : colors.text.primary, fontWeight: '600' }}>{label}</Text>
          {sublabel ? <Text style={{ color: colors.text.secondary, fontSize: 13, marginTop: 2 }}>{sublabel}</Text> : null}
        </View>
      </View>
      {rightElement || (onPress ? <Icons.ChevronRight size={20} color={colors.text.tertiary} /> : null)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;

  const { lock, biometricEnabled, enableBiometric, wipeAllData } = useAuthStore();
  const { hapticEnabled, toggleHaptic, duplicateAlertEnabled, updateSettings, ignoredDuplicateSignatures, clearIgnoredDuplicateSignatures, safeModeEnabled, setSafeModeEnabled } = useSettingsStore();
  const { profile, categories, accountTypes, quickExpenses } = useConfigStore();
  const ignoredCount = ignoredDuplicateSignatures?.length ?? 0;
  const visibleCategories = categories.filter((c) => !c.isHidden).length;
  const visibleAccountTypes = accountTypes.filter((a) => !a.isHidden).length;
  const activeQuickExpenses = quickExpenses.filter((q) => q.isActive).length;

  const switchTrack = { false: colors.background.tertiary, true: colors.accent.primary } as const;

  const handleResetAll = () => {
    Alert.alert('Réinitialiser ONYX', 'Cette action supprimera TOUTES vos données. Cette action est irréversible !', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Tout supprimer',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Confirmer', 'Êtes-vous vraiment sûr ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Confirmer', style: 'destructive', onPress: async () => wipeAllData() },
          ]);
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}
          >
            <Icons.ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>Paramètres</Text>
            <Text style={{ color: colors.text.secondary, marginTop: 2 }}>Personnalisation, sécurité et données</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <SectionTitle>Profil</SectionTitle>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.User size={20} color={colors.accent.primary} />}
                label="Mon Profil"
                sublabel={profile.name || 'Configurer votre profil'}
                onPress={() => router.push('/settings/profile')}
              />
            </GlassCard>
          </View>

          <View className="mb-6">
            <SectionTitle>Personnalisation</SectionTitle>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Tag size={20} color="#F97316" />}
                label="Catégories"
                sublabel={`${visibleCategories} catégories actives`}
                onPress={() => router.push('/settings/categories')}
              />
              <SettingsItem
                icon={<Icons.Wallet size={20} color={colors.accent.success} />}
                label="Types de Comptes"
                sublabel={`${visibleAccountTypes} types disponibles`}
                onPress={() => router.push('/settings/account-types')}
              />
              <SettingsItem
                icon={<Icons.Zap size={20} color="#EAB308" />}
                label="Dépenses Rapides"
                sublabel={`${activeQuickExpenses} raccourcis actifs`}
                onPress={() => router.push('/settings/quick-expenses')}
              />
            </GlassCard>
          </View>

          <View className="mb-6">
            <SectionTitle>Sécurité</SectionTitle>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Lock size={20} color={colors.text.secondary} />}
                label="Changer le code PIN"
                onPress={() => router.push('/settings/security')}
              />
              <SettingsItem
                icon={<Icons.Fingerprint size={20} color={colors.text.secondary} />}
                label="Déverrouillage biométrique"
                rightElement={<Switch value={biometricEnabled} onValueChange={(v) => enableBiometric(v)} trackColor={switchTrack} thumbColor={colors.background.secondary} />}
              />
              <SettingsItem
                icon={<Icons.LogOut size={20} color={colors.text.secondary} />}
                label="Verrouiller maintenant"
                onPress={() => lock()}
              />
              <SettingsItem
                icon={<Icons.Wrench size={20} color={colors.text.secondary} />}
                label="Mode secours"
                sublabel="Désactive les écrans lourds après un crash"
                rightElement={<Switch value={safeModeEnabled ?? false} onValueChange={setSafeModeEnabled} trackColor={switchTrack} thumbColor={colors.background.secondary} />}
              />
            </GlassCard>
          </View>

          <View className="mb-6">
            <SectionTitle>Préférences</SectionTitle>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Vibrate size={20} color={colors.text.secondary} />}
                label="Retour haptique"
                sublabel="Vibrations lors des interactions"
                rightElement={<Switch value={hapticEnabled} onValueChange={toggleHaptic} trackColor={switchTrack} thumbColor={colors.background.secondary} />}
              />
              <SettingsItem
                icon={<Icons.Copy size={20} color="#8B5CF6" />}
                label="Alerte doublons"
                sublabel="Alerter avant d'ajouter une transaction similaire"
                rightElement={<Switch value={duplicateAlertEnabled ?? true} onValueChange={(v) => updateSettings({ duplicateAlertEnabled: v })} trackColor={switchTrack} thumbColor={colors.background.secondary} />}
              />
              {ignoredCount > 0 ? (
                <SettingsItem
                  icon={<Icons.List size={20} color={colors.text.secondary} />}
                  label="Règles ignorées"
                  sublabel={`${ignoredCount} type(s) sans alerte doublon`}
                  onPress={() =>
                    Alert.alert('Règles ignorées', 'Réinitialiser toutes les règles "Ne plus alerter" pour les doublons ?', [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Réinitialiser', onPress: () => clearIgnoredDuplicateSignatures() },
                    ])
                  }
                />
              ) : null}
            </GlassCard>
          </View>

          <View className="mb-6">
            <SectionTitle>Données</SectionTitle>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Database size={20} color={colors.accent.primary} />}
                label="Gestion des données"
                sublabel="Sauvegarde, export, import"
                onPress={() => router.push('/settings/data')}
              />
              <SettingsItem
                icon={<Icons.FileUp size={20} color={colors.accent.success} />}
                label="Import bancaire CSV"
                sublabel="Relevé Caisse d'Épargne par compte"
                onPress={() => router.push('/settings/bank-import')}
              />
              <SettingsItem
                icon={<Icons.GitBranch size={20} color="#8B5CF6" />}
                label="Journal des versions"
                sublabel="Historique des mises à jour"
                onPress={() => router.push('/settings/changelog')}
              />
              <SettingsItem
                icon={<Icons.Bug size={20} color={colors.accent.danger} />}
                label="Journal d'erreurs"
                sublabel="Erreurs capturées et stack traces"
                onPress={() => router.push('/settings/errors')}
              />
              <SettingsItem
                icon={<Icons.Trash2 size={20} color={colors.accent.danger} />}
                label="Réinitialiser toutes les données"
                onPress={handleResetAll}
                danger
              />
            </GlassCard>
          </View>

          <View className="mb-6">
            <SectionTitle>À propos</SectionTitle>
            <GlassCard noPadding>
              <View className="p-4">
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: colors.text.secondary }}>Version</Text>
                  <Text style={{ color: colors.text.primary, fontWeight: '600' }}>{getAppVersion()}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.text.secondary }}>Stockage</Text>
                  <Text style={{ color: colors.text.primary, fontWeight: '600' }}>100% local</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          <View className="items-center py-8">
            <View className="w-12 h-12 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: `${colors.accent.primary}20` }}>
              <Icons.Shield size={24} color={colors.accent.primary} />
            </View>
            <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: 18 }}>ONYX</Text>
            <Text className="text-sm text-center mt-1" style={{ color: colors.text.secondary }}>
              Finances Personnelles
            </Text>
          </View>

          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
