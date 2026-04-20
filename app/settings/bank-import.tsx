import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/stores';
import { importBankCsv, previewBankCsvImport, type BankImportPreview } from '@/utils/bankCsvImport';

export default function BankImportScreen() {
  const router = useRouter();
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? '');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('releve.csv');
  const [preview, setPreview] = useState<BankImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/plain', 'application/vnd.ms-excel', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;

    setLoading(true);
    try {
      setFileUri(asset.uri);
      setFileName(asset.name || 'releve.csv');
      const resultPreview = await previewBankCsvImport(asset.uri, selectedAccountId, asset.name || 'releve.csv');
      setPreview(resultPreview.preview);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de lire le fichier');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!fileUri) {
      Alert.alert('Erreur', 'Sélectionnez un fichier CSV');
      return;
    }
    if (!selectedAccountId) {
      Alert.alert('Erreur', 'Sélectionnez un compte cible');
      return;
    }

    setImporting(true);
    try {
      const finalPreview = await importBankCsv(fileUri, selectedAccountId, fileName);
      Alert.alert(
        'Import terminé',
        `${finalPreview.newRows} nouvelles transaction(s) ajoutée(s), ${finalPreview.duplicateRows} doublon(s), ${finalPreview.ignoredRows} ignorée(s).`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible d’importer le CSV');
    } finally {
      setImporting(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Import bancaire CSV</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <GlassCard className="mb-4">
            <Text className="text-white font-semibold mb-2">Compte cible</Text>
            <Text className="text-onyx-500 text-sm mb-4">Chaque export bancaire correspond à un seul compte. Choisissez le compte avant l’import.</Text>
            <View style={{ gap: 8 }}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => setSelectedAccountId(account.id)}
                  className="px-4 py-3 rounded-xl flex-row items-center justify-between"
                  style={{ backgroundColor: selectedAccountId === account.id ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)' }}
                >
                  <Text className="text-white font-medium">{account.name}</Text>
                  {selectedAccountId === account.id ? <Icons.Check size={18} color="#6366F1" /> : null}
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="text-white font-semibold mb-2">Fichier CSV</Text>
            <Text className="text-onyx-500 text-sm mb-4">Format Caisse d'Épargne. Un export = un compte.</Text>
            <Button title="Choisir un CSV" variant="primary" fullWidth onPress={pickFile} icon={<Icons.Upload size={18} color="white" />} />
            {fileName ? <Text className="text-onyx-500 text-xs mt-3">{fileName}</Text> : null}
          </GlassCard>

          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          )}

          {preview && selectedAccount && (
            <GlassCard className="mb-4">
              <Text className="text-white font-semibold mb-2">Aperçu</Text>
              <Text className="text-onyx-500 text-sm mb-3">{preview.totalRows} lignes · {preview.newRows} nouvelles · {preview.duplicateRows} doublons · {preview.ignoredRows} ignorées</Text>
              <View style={{ gap: 6 }}>
                {preview.sampleRows.slice(0, 8).map((row, index) => (
                  <View key={`${row.label}-${index}`} className="flex-row justify-between items-center px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <View className="flex-1 pr-3">
                      <Text className="text-white text-sm" numberOfLines={1}>{row.label}</Text>
                      <Text className="text-onyx-500 text-xs">{row.date} · {row.category}</Text>
                    </View>
                    <Text className={row.type === 'income' ? 'text-accent-success' : 'text-accent-danger'}>
                      {row.type === 'income' ? '+' : row.type === 'transfer' ? '' : '-'}{row.amount.toFixed(2)} €
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          <Button
            title={importing ? 'Import en cours...' : 'Importer dans ce compte'}
            variant="secondary"
            fullWidth
            onPress={handleImport}
            disabled={!fileUri || !selectedAccountId || importing}
            icon={<Icons.Download size={18} color="#6366F1" />}
          />

          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
