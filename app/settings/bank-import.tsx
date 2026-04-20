import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAccountStore, useSettingsStore } from '@/stores';
import { buildBankImportReconciliation, importBankCsv, previewBankCsvImport, suggestBankImportAccountId, type BankImportPreview } from '@/utils/bankCsvImport';
import { formatCurrency } from '@/utils/format';
import { useTheme } from '@/hooks/useTheme';

export default function BankImportScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const accounts = useAccountStore((state) => state.accounts.filter((a) => !a.isArchived));
  const lastBankImportAccountId = useSettingsStore((state) => state.lastBankImportAccountId);
  const setLastBankImportAccountId = useSettingsStore((state) => state.setLastBankImportAccountId);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('releve.csv');
  const [preview, setPreview] = useState<BankImportPreview | null>(null);
  const [previewNetAmount, setPreviewNetAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [targetBalanceInput, setTargetBalanceInput] = useState('');

  useEffect(() => {
    if (selectedAccountId && accounts.some((account) => account.id === selectedAccountId)) return;
    const suggested = suggestBankImportAccountId(accounts, lastBankImportAccountId);
    if (suggested) setSelectedAccountId(suggested);
    else if (accounts[0]) setSelectedAccountId(accounts[0].id);
  }, [accounts, lastBankImportAccountId, selectedAccountId]);

  const selectedAccount = useMemo(() => accounts.find((account) => account.id === selectedAccountId) ?? null, [accounts, selectedAccountId]);
  const orderedAccounts = useMemo(() => [...accounts].sort((a, b) => {
    const score = (account: { type: string; bankLabel?: string; bank?: string }) => (account.bankLabel || account.bank ? 0 : 1) + (account.type === 'checking' ? 0 : 2);
    return score(a) - score(b);
  }), [accounts]);

  const importSteps = [
    { n: 1, label: 'Compte', done: Boolean(selectedAccountId) },
    { n: 2, label: 'Fichier', done: Boolean(fileUri) },
    { n: 3, label: 'Aperçu', done: Boolean(preview) },
  ];

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain', 'application/vnd.ms-excel', '*/*'], copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;

    setLoading(true);
    try {
      setFileUri(asset.uri);
      setFileName(asset.name || 'releve.csv');
      const resultPreview = await previewBankCsvImport(asset.uri, selectedAccountId, asset.name || 'releve.csv');
      setPreview(resultPreview.preview);
      setPreviewNetAmount(resultPreview.transactions.reduce((total, tx) => {
        if (tx.type === 'income') return total + tx.amount;
        if (tx.type === 'expense') return total - tx.amount;
        return total;
      }, 0));
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de lire le fichier');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!fileUri) { Alert.alert('Erreur', 'Sélectionnez un fichier CSV'); return; }
    if (!selectedAccountId) { Alert.alert('Erreur', 'Sélectionnez un compte cible'); return; }

    const targetBalance = targetBalanceInput.trim() ? Number.parseFloat(targetBalanceInput.replace(',', '.')) : undefined;
    if (targetBalanceInput.trim() && !Number.isFinite(targetBalance ?? NaN)) { Alert.alert('Erreur', 'Solde cible invalide'); return; }

    setImporting(true);
    try {
      const finalPreview = await importBankCsv(fileUri, selectedAccountId, fileName, { targetBalance, createReconciliationTransaction: Number.isFinite(targetBalance ?? NaN) });
      setLastBankImportAccountId(selectedAccountId);
      const currentBalance = selectedAccount?.balance ?? 0;
      const reconciliation = buildBankImportReconciliation(currentBalance, previewNetAmount, targetBalance);
      Alert.alert('Import terminé', `${finalPreview.newRows} nouvelle(s) transaction(s), ${finalPreview.duplicateRows} doublon(s), ${finalPreview.ignoredRows} ignorée(s).${targetBalanceInput.trim() ? `\nÉcart de réconciliation: ${formatCurrency(reconciliation.adjustment)}.` : ''}`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible d’importer le CSV');
    } finally {
      setImporting(false);
    }
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-6 pt-4 pb-3">
          <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 rounded-full items-center justify-center mr-4" style={{ backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.background.tertiary }}>
            <Icons.ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700' }}>Import bancaire CSV</Text>
            <Text style={{ color: colors.text.secondary, marginTop: 2 }}>Caisse d'Épargne · un export = un compte</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <GlassCard className="mb-4">
            <View className="flex-row items-center" style={{ gap: 10 }}>
              {importSteps.map((step, index) => (
                <React.Fragment key={step.n}>
                  <View className="flex-1 items-center">
                    <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: step.done ? colors.accent.primary : colors.background.tertiary }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{step.done ? '✓' : step.n}</Text>
                    </View>
                    <Text className="text-[10px] mt-2" style={{ color: colors.text.secondary }}>{step.label}</Text>
                  </View>
                  {index < importSteps.length - 1 && <View className="h-px flex-1" style={{ backgroundColor: step.done ? colors.accent.primary : colors.background.tertiary }} />}
                </React.Fragment>
              ))}
            </View>
          </GlassCard>

          <GlassCard className="mb-4" variant="light">
            <Text className="font-semibold mb-2" style={{ color: colors.text.primary }}>Comment importer</Text>
            <Text className="text-sm" style={{ color: colors.text.secondary }}>1. Choisissez le compte lié au relevé. 2. Sélectionnez le CSV. 3. Vérifiez l’aperçu et l’éventuel solde cible avant d’importer.</Text>
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="font-semibold mb-2" style={{ color: colors.text.primary }}>Compte cible</Text>
            <Text className="text-sm mb-4" style={{ color: colors.text.secondary }}>Un relevé = un compte. Reprenez le même compte à chaque import bancaire.</Text>
            <View style={{ gap: 10 }}>
              {orderedAccounts.map((account) => {
                const active = selectedAccountId === account.id;
                return (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() => setSelectedAccountId(account.id)}
                    className="px-4 py-4 rounded-2xl flex-row items-center justify-between"
                    style={{ backgroundColor: active ? `${colors.accent.primary}26` : colors.background.card, borderWidth: 1, borderColor: active ? colors.accent.primary : colors.background.tertiary, shadowColor: active ? colors.accent.primary : '#000', shadowOpacity: active ? 0.12 : 0.05, shadowRadius: 8, elevation: 0 }}
                  >
                    <View>
                      <Text style={{ color: colors.text.primary, fontWeight: '600' }}>{account.name}</Text>
                      <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>{account.bankLabel || account.bank || 'Banque non renseignée'}</Text>
                      <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>{formatCurrency(account.balance)}</Text>
                    </View>
                    {active ? <Icons.Check size={18} color={colors.accent.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="font-semibold mb-2" style={{ color: colors.text.primary }}>Fichier CSV</Text>
            <Text className="text-sm mb-4" style={{ color: colors.text.secondary }}>Importez un export Caisse d'Épargne avec une ligne par opération.</Text>
            <Button title="Choisir un CSV" variant="primary" fullWidth onPress={pickFile} icon={<Icons.Upload size={18} color="white" />} />
            {fileUri ? <Text className="text-xs mt-3" style={{ color: colors.text.secondary }}>{fileName}</Text> : null}
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="font-semibold mb-2" style={{ color: colors.text.primary }}>Solde cible</Text>
            <Text className="text-sm mb-4" style={{ color: colors.text.secondary }}>Optionnel. Utile pour ajuster le solde après l’import.</Text>
            <TextInput value={targetBalanceInput} onChangeText={setTargetBalanceInput} placeholder="Ex: 1240,50" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" className="px-4 py-3 rounded-xl text-base" style={{ backgroundColor: colors.background.card, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} />
              {selectedAccount && targetBalanceInput.trim() && Number.isFinite(Number.parseFloat(targetBalanceInput.replace(',', '.'))) ? (
                <View className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: `${colors.accent.warning}14`, borderWidth: 1, borderColor: `${colors.accent.warning}28` }}>
                  <Text className="text-xs uppercase tracking-[0.12em] mb-1" style={{ color: colors.accent.warning }}>Réconciliation</Text>
                  {(() => {
                    const target = Number.parseFloat(targetBalanceInput.replace(',', '.'));
                    const previewCurrent = preview ? buildBankImportReconciliation(selectedAccount.balance, previewNetAmount, target) : null;
                    return previewCurrent ? <Text className="text-sm" style={{ color: colors.text.secondary }}>Solde actuel {formatCurrency(previewCurrent.currentBalance)} · cible {formatCurrency(previewCurrent.targetBalance)} · écart {formatCurrency(previewCurrent.adjustment)}</Text> : null;
                  })()}
                </View>
            ) : null}
          </GlassCard>

          {loading ? <View className="items-center py-4"><ActivityIndicator size="large" color={colors.accent.primary} /></View> : null}

          {preview && selectedAccount ? (
            <GlassCard className="mb-4">
              <Text className="font-semibold mb-2" style={{ color: colors.text.primary }}>Aperçu</Text>
              <Text className="text-sm mb-4" style={{ color: colors.text.secondary }}>{preview.totalRows} lignes · {preview.newRows} nouvelles · {preview.duplicateRows} doublons · {preview.ignoredRows} ignorées</Text>

              <View className="p-4 rounded-2xl mb-4" style={{ backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.background.tertiary }}>
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>Répartition</Text>
                <Text className="text-xs" style={{ color: colors.text.secondary }}>Revenus: {preview.typeBreakdown.income} · Dépenses: {preview.typeBreakdown.expense} · Virements: {preview.typeBreakdown.transfer}</Text>
              </View>

              {preview.categoryBreakdown.length > 0 ? (
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>Catégories principales</Text>
                  <View style={{ gap: 8 }}>
                    {preview.categoryBreakdown.slice(0, 5).map((item) => (
                      <View key={item.category} className="flex-row items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.background.tertiary }}>
                        <Text className="text-xs flex-1 pr-3" numberOfLines={1} style={{ color: colors.text.primary }}>{item.category}</Text>
                        <Text className="text-xs" style={{ color: colors.text.secondary }}>{item.count} · {formatCurrency(item.amount)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={{ gap: 8 }}>
                {preview.sampleRows.slice(0, 8).map((row, index) => (
                  <View key={`${row.label}-${index}`} className="flex-row justify-between items-center px-4 py-3 rounded-xl" style={{ backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.background.tertiary }}>
                    <View className="flex-1 pr-3">
                      <Text className="text-sm" numberOfLines={1} style={{ color: colors.text.primary }}>{row.label}</Text>
                      <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>{row.date} · {row.category}</Text>
                    </View>
                    <Text style={{ color: row.type === 'income' ? colors.accent.success : colors.accent.danger, fontWeight: '600' }}>{row.type === 'income' ? '+' : row.type === 'transfer' ? '' : '-'}{row.amount.toFixed(2)} €</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          ) : null}

          <Button title={importing ? 'Import en cours...' : 'Importer dans ce compte'} variant="secondary" fullWidth onPress={handleImport} disabled={!fileUri || !selectedAccountId || importing} icon={<Icons.Download size={18} color={colors.accent.primary} />} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
