// ============================================
// ONYX - Settings Screen
// Paramètres complets avec personnalisation
// ============================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAuthStore, useSettingsStore, useConfigStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { storage } from '@/utils/storage';
import Constants from 'expo-constants';

const changelogMeta = require('@/constants/changelog.json') as { appVersion: string; buildNumber: string };
function getAppVersion(): string {
  const v = Constants.expoConfig?.version ?? changelogMeta?.appVersion ?? '1.0.0';
  const build = changelogMeta?.buildNumber;
  return build ? `${v} (${build})` : v;
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
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        {icon}
        <View className="ml-3 flex-1">
          <Text className={`font-medium ${danger ? 'text-accent-danger' : 'text-white'}`}>{label}</Text>
          {sublabel && <Text className="text-onyx-500 text-sm">{sublabel}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Icons.ChevronRight size={20} color="#52525B" />)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  
  const { lock, biometricEnabled, enableBiometric, resetAuth, wipeAllData } = useAuthStore();
  const {
    hapticEnabled,
    toggleHaptic,
    duplicateAlertEnabled,
    updateSettings,
    ignoredDuplicateSignatures,
    clearIgnoredDuplicateSignatures,
  } = useSettingsStore();
  const { profile, categories, accountTypes, quickExpenses } = useConfigStore();
  const ignoredCount = ignoredDuplicateSignatures?.length ?? 0;

  const handleResetAll = () => {
    Alert.alert(
      'Réinitialiser ONYX',
      'Cette action supprimera TOUTES vos données. Cette action est irréversible !',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmer',
              'Êtes-vous vraiment sûr ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Confirmer',
                  style: 'destructive',
                  onPress: async () => {
                    await wipeAllData();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const visibleCategories = categories.filter(c => !c.isHidden).length;
  const visibleAccountTypes = accountTypes.filter(a => !a.isHidden).length;
  const activeQuickExpenses = quickExpenses.filter(q => q.isActive).length;

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Paramètres</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Profil */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Profil</Text>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.User size={20} color="#6366F1" />}
                label="Mon Profil"
                sublabel={profile.name || 'Configurer votre profil'}
                onPress={() => router.push('/settings/profile')}
              />
            </GlassCard>
          </View>

          {/* Personnalisation */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Personnalisation</Text>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Tag size={20} color="#F97316" />}
                label="Catégories"
                sublabel={`${visibleCategories} catégories actives`}
                onPress={() => router.push('/settings/categories')}
              />
              <SettingsItem
                icon={<Icons.Wallet size={20} color="#10B981" />}
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

          {/* Sécurité */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Sécurité</Text>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Lock size={20} color="#71717A" />}
                label="Changer le code PIN"
                onPress={() => router.push('/settings/security')}
              />
              <SettingsItem
                icon={<Icons.Fingerprint size={20} color="#71717A" />}
                label="Déverrouillage biométrique"
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={(v) => enableBiometric(v)}
                    trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                    thumbColor="#fff"
                  />
                }
              />
              <SettingsItem
                icon={<Icons.LogOut size={20} color="#71717A" />}
                label="Verrouiller maintenant"
                onPress={() => lock()}
              />
            </GlassCard>
          </View>

          {/* Préférences */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Préférences</Text>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Vibrate size={20} color="#71717A" />}
                label="Retour haptique"
                sublabel="Vibrations lors des interactions"
                rightElement={
                  <Switch
                    value={hapticEnabled}
                    onValueChange={toggleHaptic}
                    trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                    thumbColor="#fff"
                  />
                }
              />
              <SettingsItem
                icon={<Icons.Copy size={20} color="#8B5CF6" />}
                label="Alerte doublons"
                sublabel="Alerter avant d'ajouter une transaction similaire"
                rightElement={
                  <Switch
                    value={duplicateAlertEnabled ?? true}
                    onValueChange={(v) => updateSettings({ duplicateAlertEnabled: v })}
                    trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                    thumbColor="#fff"
                  />
                }
              />
              {ignoredCount > 0 && (
                <SettingsItem
                  icon={<Icons.List size={20} color="#71717A" />}
                  label="Règles ignorées"
                  sublabel={`${ignoredCount} type(s) sans alerte doublon`}
                  onPress={() =>
                    Alert.alert(
                      'Règles ignorées',
                      'Réinitialiser toutes les règles "Ne plus alerter" pour les doublons ?',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Réinitialiser', onPress: () => clearIgnoredDuplicateSignatures() },
                      ]
                    )
                  }
                />
              )}
            </GlassCard>
          </View>

          {/* Automatisation & outils */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Automatisation & outils</Text>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.GitBranch size={20} color="#8B5CF6" />}
                label="Règles automatiques"
                sublabel="Si... Alors..."
                onPress={() => router.push('/settings/automation-rules')}
              />
              <SettingsItem
                icon={<Icons.Bell size={20} color="#F59E0B" />}
                label="Rappels"
                sublabel="Rappels personnalisés"
                onPress={() => router.push('/settings/reminders')}
              />
              <SettingsItem
                icon={<Icons.Star size={20} color="#EC4899" />}
                label="Liste d'envies"
                sublabel="Wishlist"
                onPress={() => router.push('/settings/wishlist')}
              />
              <SettingsItem
                icon={<Icons.FileText size={20} color="#10B981" />}
                label="Templates"
                sublabel="Transactions rapides"
                onPress={() => router.push('/settings/templates')}
              />
              <SettingsItem
                icon={<Icons.Trophy size={20} color="#F59E0B" />}
                label="Réalisations"
                sublabel="Badges et défis"
                onPress={() => router.push('/settings/achievements')}
              />
            </GlassCard>
          </View>

          {/* Données */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Données</Text>
            <GlassCard noPadding>
              <SettingsItem
                icon={<Icons.Database size={20} color="#6366F1" />}
                label="Gestion des données"
                sublabel="Sauvegarde, export, import"
                onPress={() => router.push('/settings/data')}
              />
              <SettingsItem
                icon={<Icons.GitBranch size={20} color="#8B5CF6" />}
                label="Journal des versions"
                sublabel="Historique des mises à jour"
                onPress={() => router.push('/settings/changelog')}
              />
              <SettingsItem
                icon={<Icons.Trash2 size={20} color="#EF4444" />}
                label="Réinitialiser toutes les données"
                onPress={handleResetAll}
                danger
              />
            </GlassCard>
          </View>

          {/* À propos */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">À propos</Text>
            <GlassCard noPadding>
              <View className="p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-onyx-500">Version</Text>
                  <Text className="text-white">{getAppVersion()}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-onyx-500">Stockage</Text>
                  <Text className="text-white">100% Local (AsyncStorage)</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Footer */}
          <View className="items-center py-8">
            <View 
              className="w-12 h-12 rounded-xl items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
            >
              <Icons.Shield size={24} color="#6366F1" />
            </View>
            <Text className="text-white font-bold text-lg">ONYX</Text>
            <Text className="text-onyx-500 text-sm text-center mt-1">
              Finances Personnelles{'\n'}
              100% Offline · Vos données restent privées
            </Text>
          </View>

          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
