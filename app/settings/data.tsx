// ============================================
// ONYX - Data Management Screen
// Gestion des données : sauvegarde, export, import
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  createBackup, 
  restoreBackup, 
  exportAllData, 
  importData,
  getStoredDataVersion,
  CURRENT_DATA_VERSION,
} from '@/utils/migrations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DataManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const dataVersion = getStoredDataVersion();

  const handleCreateBackup = () => {
    setLoading(true);
    try {
      const backupKey = createBackup();
      setLastBackup(new Date().toISOString());
      Alert.alert('Succès', 'Sauvegarde créée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = () => {
    Alert.alert(
      'Restaurer la sauvegarde',
      'Cela remplacera toutes vos données actuelles par la dernière sauvegarde. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            try {
              const success = restoreBackup();
              if (success) {
                Alert.alert('Succès', 'Données restaurées ! Redémarrez l\'application.');
              } else {
                Alert.alert('Erreur', 'Aucune sauvegarde trouvée');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de restaurer');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const jsonData = exportAllData();
      const fileName = `onyx_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, jsonData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter les données ONYX',
        });
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      'Importer des données',
      'Cela remplacera TOUTES vos données actuelles. Une sauvegarde sera créée avant l\'import. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Choisir un fichier',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
              });

              if (result.canceled) {
                return;
              }

              setLoading(true);
              const fileUri = result.assets[0].uri;
              const jsonData = await FileSystem.readAsStringAsync(fileUri);
              
              const success = importData(jsonData);
              
              if (success) {
                Alert.alert('Succès', 'Données importées ! Redémarrez l\'application.');
              } else {
                Alert.alert('Erreur', 'Format de fichier invalide');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'Impossible d\'importer les données');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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
          <Text className="text-white text-xl font-bold">Gestion des Données</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Info Version */}
          <GlassCard className="mb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-onyx-500 text-sm">Version des données</Text>
                <Text className="text-white text-2xl font-bold">v{dataVersion}</Text>
              </View>
              <View className="items-end">
                <Text className="text-onyx-500 text-sm">Version cible</Text>
                <Text className="text-accent-primary text-2xl font-bold">v{CURRENT_DATA_VERSION}</Text>
              </View>
            </View>
            {dataVersion === CURRENT_DATA_VERSION && (
              <View className="flex-row items-center mt-3 pt-3 border-t border-onyx-200/10">
                <Icons.CheckCircle size={16} color="#10B981" />
                <Text className="text-accent-income text-sm ml-2">Données à jour</Text>
              </View>
            )}
          </GlassCard>

          {/* Sauvegardes locales */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Sauvegardes Locales</Text>
            <GlassCard>
              <Text className="text-white font-medium mb-2">Sauvegarde automatique</Text>
              <Text className="text-onyx-500 text-sm mb-4">
                ONYX crée automatiquement des sauvegardes avant chaque migration. 
                Vous pouvez aussi en créer manuellement.
              </Text>
              
              <View style={{ gap: 12 }}>
                <Button
                  title="Créer une sauvegarde"
                  variant="secondary"
                  fullWidth
                  onPress={handleCreateBackup}
                  disabled={loading}
                  icon={<Icons.Save size={18} color="#6366F1" />}
                />
                <Button
                  title="Restaurer la dernière sauvegarde"
                  variant="ghost"
                  fullWidth
                  onPress={handleRestoreBackup}
                  disabled={loading}
                  icon={<Icons.RotateCcw size={18} color="#71717A" />}
                />
              </View>
            </GlassCard>
          </View>

          {/* Export / Import */}
          <View className="mb-6">
            <Text className="text-onyx-500 text-sm font-medium mb-3 uppercase">Export / Import</Text>
            <GlassCard>
              <Text className="text-white font-medium mb-2">Transférer vos données</Text>
              <Text className="text-onyx-500 text-sm mb-4">
                Exportez vos données pour les sauvegarder ailleurs ou les transférer sur un autre appareil.
              </Text>
              
              <View style={{ gap: 12 }}>
                <Button
                  title="Exporter toutes les données (JSON)"
                  variant="primary"
                  fullWidth
                  onPress={handleExportData}
                  disabled={loading}
                  icon={<Icons.Download size={18} color="white" />}
                />
                <Button
                  title="Importer des données"
                  variant="secondary"
                  fullWidth
                  onPress={handleImportData}
                  disabled={loading}
                  icon={<Icons.Upload size={18} color="#6366F1" />}
                />
              </View>
            </GlassCard>
          </View>

          {/* Info sécurité */}
          <GlassCard className="mb-6">
            <View className="flex-row items-start">
              <Icons.Shield size={20} color="#6366F1" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-medium mb-1">Vos données sont sécurisées</Text>
                <Text className="text-onyx-500 text-sm">
                  • Stockées localement avec MMKV (chiffré){'\n'}
                  • Jamais envoyées sur internet{'\n'}
                  • Préservées lors des mises à jour{'\n'}
                  • 3 sauvegardes automatiques conservées
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Avertissement */}
          <View className="mb-8 p-4 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <View className="flex-row items-start">
              <Icons.AlertTriangle size={18} color="#F59E0B" />
              <Text className="text-onyx-400 text-sm ml-2 flex-1">
                <Text className="font-semibold text-yellow-500">Important :</Text> Si vous désinstallez l'application, 
                toutes les données seront perdues. Pensez à exporter régulièrement !
              </Text>
            </View>
          </View>

          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-onyx-500 mt-2">Traitement en cours...</Text>
            </View>
          )}

          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
