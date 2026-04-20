// ============================================
// ONYX - Data Management Screen
// Export / import JSON only
// ============================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { exportDataAsJSON, importDataFromJSON } from '@/utils/dataExport';
import { useTheme } from '@/hooks/useTheme';

export default function DataManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const { colors } = theme;

  const handleExportData = async () => {
    setLoading(true);
    try {
      await exportDataAsJSON();
    } catch (error) {
      console.error('[ONYX] export error:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter les données. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/x-ndjson', 'text/plain', '*/*'],
      });
      if (result.canceled) return;

      setLoading(true);
      const fileUri = result.assets[0]?.uri;
      if (!fileUri) {
        Alert.alert('Erreur', 'Fichier invalide');
        return;
      }
      await importDataFromJSON(fileUri);
    } catch (error) {
      console.error('[ONYX] import error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <Icons.ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text.primary }}>Gestion des données</Text>
        </View>

        <View className="flex-1 px-6 justify-center">
          <GlassCard>
            <Text className="font-medium mb-2" style={{ color: colors.text.primary }}>Export / Import JSON</Text>
            <Text className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Exportez ou importez vos données au format JSON/NDJSON.
            </Text>

            <View style={{ gap: 12 }}>
              <Button
                title="Exporter en JSON"
                variant="primary"
                fullWidth
                onPress={handleExportData}
                disabled={loading}
                icon={<Icons.Download size={18} color="white" />}
              />
              <Button
                title="Importer un JSON"
                variant="secondary"
                fullWidth
                onPress={handleImportData}
                disabled={loading}
                icon={<Icons.Upload size={18} color={colors.accent.primary} />}
              />
            </View>
          </GlassCard>

          {loading && (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="mt-2" style={{ color: colors.text.secondary }}>Traitement en cours...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
