import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/useTheme';
import { clearErrorHistory, clearLastError, getErrorHistory, type CapturedError } from '@/utils/debugLogger';

function ErrorCard({ error }: { error: CapturedError }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <GlassCard className="mb-3">
      <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{error.message}</Text>
      <Text className="text-xs mt-1" style={{ color: colors.text.secondary }}>{new Date(error.timestamp).toLocaleString()}</Text>
      {error.stack ? (
        <Text className="text-xs mt-3" style={{ color: colors.text.tertiary }} selectable>
          {error.stack.slice(0, 1200)}
          {error.stack.length > 1200 ? '…' : ''}
        </Text>
      ) : null}
      {error.componentStack ? (
        <Text className="text-xs mt-3" style={{ color: colors.text.tertiary }} selectable>
          {error.componentStack.slice(0, 1200)}
          {error.componentStack.length > 1200 ? '…' : ''}
        </Text>
      ) : null}
    </GlassCard>
  );
}

export default function ErrorsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [history, setHistory] = useState<CapturedError[]>([]);

  const refresh = async () => {
    const items = await getErrorHistory();
    setHistory(items);
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const copyAll = async () => {
    const payload = history.map((e) => [
      `# ${e.message}`,
      `timestamp: ${e.timestamp}`,
      e.isPromiseRejection ? 'promiseRejection: true' : '',
      e.stack ? `stack:\n${e.stack}` : '',
      e.componentStack ? `componentStack:\n${e.componentStack}` : '',
    ].filter(Boolean).join('\n')).join('\n\n---\n\n');
    try {
      await Share.share({
        title: 'Journal d’erreurs ONYX',
        message: payload || 'Aucune erreur enregistrée.',
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de partager le journal.');
    }
  };

  const exportText = async () => {
    const payload = history.map((e) => [
      `# ${e.message}`,
      `timestamp: ${e.timestamp}`,
      e.isPromiseRejection ? 'promiseRejection: true' : '',
      e.stack ? `stack:\n${e.stack}` : '',
      e.componentStack ? `componentStack:\n${e.componentStack}` : '',
    ].filter(Boolean).join('\n')).join('\n\n---\n\n');
    Alert.alert('Journal', payload || 'Aucune erreur enregistrée.');
  };

  const clearAll = async () => {
    Alert.alert('Vider le journal', 'Supprimer toutes les erreurs enregistrées ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await clearLastError();
          await clearErrorHistory();
          setHistory([]);
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}
          >
            <Icons.ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>Journal d'erreurs</Text>
            <Text style={{ color: colors.text.secondary, marginTop: 2 }}>Historique complet pour le débogage</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="mb-4 flex-row" style={{ gap: 10 }}>
            <TouchableOpacity onPress={copyAll} className="flex-1 px-4 py-3 rounded-2xl items-center" style={{ backgroundColor: colors.accent.primary }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exportText} className="flex-1 px-4 py-3 rounded-2xl items-center" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Texte</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} className="flex-1 px-4 py-3 rounded-2xl items-center" style={{ backgroundColor: `${colors.accent.danger}22`, borderWidth: 1, borderColor: colors.accent.danger }}>
              <Text style={{ color: colors.accent.danger, fontWeight: '700' }}>Vider</Text>
            </TouchableOpacity>
          </View>

          <GlassCard className="mb-4">
            <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Comment s'en servir</Text>
            <Text className="text-sm mt-2" style={{ color: colors.text.secondary }}>
              Quand l'app plante, ouvrez ce journal, copiez l'erreur, puis envoyez-la moi. Le message et la stack complète seront conservés ici.
            </Text>
          </GlassCard>

          {history.length === 0 ? (
            <GlassCard>
              <Text style={{ color: colors.text.secondary }}>Aucune erreur enregistrée.</Text>
            </GlassCard>
          ) : history.map((error, idx) => <ErrorCard key={`${error.timestamp}-${idx}`} error={error} />)}

          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
