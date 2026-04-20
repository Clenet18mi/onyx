import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAuthStore, useSettingsStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { PinPad } from '@/components/auth/PinPad';
import { PinDots } from '@/components/auth/PinDots';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeParseISO } from '@/utils/format';
import { useTheme } from '@/hooks/useTheme';

type Step = 'menu' | 'current' | 'new' | 'confirm';

export default function SecurityScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const { changePin, pinLength, biometricEnabled, enableBiometric, lock, wipeDataOnMaxFailures, setWipeDataOnMaxFailures, autoLockDelay, setAutoLockDelay, accessLog } = useAuthStore();
  const privacyMode = useSettingsStore((s) => s.privacyMode ?? false);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [step, setStep] = useState<Step>('menu');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnableWipeData = (value: boolean) => {
    if (value) {
      Alert.alert('⚠️ Sécurité maximale', "Si cette option est activée, après 10 tentatives de PIN incorrectes, TOUTES vos données seront DÉFINITIVEMENT EFFACÉES.\n\nRecommandé uniquement si vous avez des backups réguliers.", [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Activer', style: 'destructive', onPress: () => setWipeDataOnMaxFailures(true) },
      ]);
    } else {
      setWipeDataOnMaxFailures(false);
    }
  };

  const onCurrentPinComplete = () => { if (currentPin.length === pinLength) setStep('new'); };
  const onNewPinComplete = () => { if (newPin.length === pinLength) setStep('confirm'); };
  const onSubmitChangePin = async () => {
    if (confirmPin !== newPin) { setError('Les deux codes ne correspondent pas'); return; }
    setLoading(true);
    setError('');
    try {
      const ok = await changePin(currentPin, newPin);
      if (ok) Alert.alert('Succès', 'Votre code PIN a été modifié.', [{ text: 'OK', onPress: () => router.back() }]);
      else { setError('Code actuel incorrect'); setCurrentPin(''); setStep('current'); }
    } catch (_) { setError('Une erreur est survenue'); } finally { setLoading(false); }
  };
  const handleNumberPress = (num: string) => { if (step === 'current' && currentPin.length < pinLength) setCurrentPin((p) => p + num); else if (step === 'new' && newPin.length < pinLength) setNewPin((p) => p + num); else if (step === 'confirm' && confirmPin.length < pinLength) setConfirmPin((p) => p + num); };
  const handleDeletePress = () => { if (step === 'current') setCurrentPin((p) => p.slice(0, -1)); else if (step === 'new') setNewPin((p) => p.slice(0, -1)); else if (step === 'confirm') setConfirmPin((p) => p.slice(0, -1)); };

  React.useEffect(() => { if (step === 'current' && currentPin.length === pinLength) onCurrentPinComplete(); }, [currentPin, step, pinLength]);
  React.useEffect(() => { if (step === 'new' && newPin.length === pinLength) onNewPinComplete(); }, [newPin, step, pinLength]);

  if (step === 'current' || step === 'new' || step === 'confirm') {
    const isConfirm = step === 'confirm';
    const title = step === 'current' ? 'Entrez votre code actuel' : step === 'new' ? 'Nouveau code PIN' : 'Confirmez le nouveau code';
    const filled = step === 'current' ? currentPin.length : step === 'new' ? newPin.length : confirmPin.length;
    return (
      <LinearGradient colors={colors.gradients.card} className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center px-6 py-4">
            <TouchableOpacity onPress={() => { setStep('menu'); setCurrentPin(''); setNewPin(''); setConfirmPin(''); setError(''); }} className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.ChevronLeft size={24} color={colors.text.primary} /></TouchableOpacity>
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>{title}</Text>
          </View>
          <View className="flex-1 justify-center items-center px-8">
            <View className="mb-8"><PinDots length={pinLength} filled={filled} error={!!error} />{error ? <Text style={{ color: colors.accent.danger, textAlign: 'center', marginTop: 16, fontSize: 13 }}>{error}</Text> : null}</View>
            {isConfirm && confirmPin.length === pinLength ? (<TouchableOpacity onPress={onSubmitChangePin} disabled={loading} className="py-4 px-8 rounded-xl mb-6" style={{ backgroundColor: loading ? colors.background.tertiary : colors.accent.primary }}><Text style={{ color: '#fff', fontWeight: '700' }}>{loading ? '...' : 'Valider'}</Text></TouchableOpacity>) : null}
            <PinPad onNumberPress={handleNumberPress} onDeletePress={handleDeletePress} showBiometric={false} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.ChevronLeft size={24} color={colors.text.primary} /></TouchableOpacity>
          <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>Sécurité</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <GlassCard noPadding className="mb-6">
            <TouchableOpacity onPress={() => setStep('current')} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><View className="flex-row items-center"><Icons.Lock size={20} color={colors.accent.primary} /><Text className="font-medium ml-3" style={{ color: colors.text.primary }}>Changer le code PIN</Text></View><Icons.ChevronRight size={20} color={colors.text.tertiary} /></TouchableOpacity>
            <View className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><View><Text style={{ color: colors.text.primary, fontWeight: '600' }}>Déverrouillage biométrique</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>Empreinte ou Face ID</Text></View><Switch value={biometricEnabled} onValueChange={enableBiometric} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} /></View>
            <View className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><View><Text style={{ color: colors.text.primary, fontWeight: '600' }}>Mode discret</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>Masquer les montants (••••• €)</Text></View><Switch value={privacyMode} onValueChange={(v) => updateSettings({ privacyMode: v })} trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }} thumbColor={colors.background.secondary} /></View>
            <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><Text style={{ color: colors.text.primary, fontWeight: '600' }}>Verrouillage automatique</Text><Text className="text-sm mb-3" style={{ color: colors.text.secondary }}>Verrouiller l'app après inactivité (passage en arrière-plan)</Text><View className="flex-row flex-wrap" style={{ gap: 8 }}>{[{ value: 0, label: 'Jamais' }, { value: 1, label: '1 min' }, { value: 5, label: '5 min' }, { value: 15, label: '15 min' }].map((opt) => (<TouchableOpacity key={opt.value} onPress={() => setAutoLockDelay(opt.value)} className="px-4 py-2 rounded-xl" style={{ backgroundColor: autoLockDelay === opt.value ? colors.accent.primary : colors.background.secondary, borderWidth: 1, borderColor: autoLockDelay === opt.value ? colors.accent.primary : colors.background.tertiary }}><Text style={{ color: autoLockDelay === opt.value ? '#fff' : colors.text.secondary, fontWeight: '600' }}>{opt.label}</Text></TouchableOpacity>))}</View></View>
            <View className="flex-row items-center justify-between p-4"><View className="flex-1"><Text style={{ color: colors.text.primary, fontWeight: '600' }}>Effacer données après 10 échecs</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>Après 10 codes PIN incorrects, toutes les données sont supprimées</Text></View><Switch value={wipeDataOnMaxFailures} onValueChange={handleEnableWipeData} trackColor={{ false: colors.background.tertiary, true: colors.accent.danger }} thumbColor={colors.background.secondary} /></View>
          </GlassCard>

          {(accessLog ?? []).length > 0 ? (
            <GlassCard noPadding className="mb-6">
              <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><Text style={{ color: colors.text.primary, fontWeight: '600' }}>Derniers accès</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>10 dernières tentatives de déverrouillage</Text></View>
              {(accessLog ?? []).slice(0, 10).map((entry, i) => {
                const d = safeParseISO(entry.date);
                if (!d) return (<View key={`${entry.date}-${i}`} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><Text style={{ color: entry.success ? colors.accent.success : colors.accent.danger }}>{entry.success ? '✓' : '✗'} {entry.success ? 'Déverrouillage réussi' : 'Échec'}</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>—</Text></View>);
                const timeStr = format(d, 'HH:mm', { locale: fr });
                const dateLabel = isToday(d) ? "aujourd'hui" : isYesterday(d) ? 'hier' : format(d, 'd MMM yyyy', { locale: fr });
                return (<View key={`${entry.date}-${i}`} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><Text style={{ color: entry.success ? colors.accent.success : colors.accent.danger }}>{entry.success ? '✓' : '✗'} {entry.success ? 'Déverrouillage réussi' : 'Échec'}</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>{dateLabel} {timeStr}</Text></View>);
              })}
            </GlassCard>
          ) : null}

          <TouchableOpacity onPress={() => lock()} className="py-4 rounded-xl items-center" style={{ backgroundColor: `${colors.accent.primary}14`, borderWidth: 1, borderColor: `${colors.accent.primary}20` }}><Text style={{ color: colors.text.primary, fontWeight: '700' }}>Verrouiller maintenant</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
