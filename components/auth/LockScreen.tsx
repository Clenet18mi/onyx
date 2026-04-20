import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Shield, ArrowRight, Fingerprint } from 'lucide-react-native';
import { useAuthStore, useSettingsStore } from '@/stores';
import { PinPad } from './PinPad';
import { PinDots } from './PinDots';
import { useTheme } from '@/hooks/useTheme';

interface LockScreenProps { onUnlock: () => void; }

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [validating, setValidating] = useState(false);
  const [forgotPinStep, setForgotPinStep] = useState<0 | 1>(0);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  const { pinLength, biometricEnabled, validatePin, unlockWithBiometric, failedAttempts, isLockedOut, getLockoutRemainingSeconds, wipeAllData } = useAuthStore();
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  useEffect(() => { (async () => { const compatible = await LocalAuthentication.hasHardwareAsync(); const enrolled = await LocalAuthentication.isEnrolledAsync(); setBiometricAvailable(compatible && enrolled); })(); }, []);
  useEffect(() => { if (biometricEnabled && biometricAvailable && !isLockedOut()) handleBiometric(); }, [biometricAvailable, biometricEnabled]);
  useEffect(() => { if (pin.length === pinLength && !validating) verifyPin(); }, [pin, pinLength, validating, verifyPin]);

  const verifyPin = useCallback(async () => {
    setValidating(true); setError(false); setErrorMessage('');
    try {
      const result = await validatePin(pin);
      if (result.success) { if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUnlock(); return; }
      if (result.shouldWipe) { Alert.alert('Sécurité', 'Trop de tentatives. Effacement des données pour protéger votre vie privée.', [{ text: 'OK', onPress: async () => { await wipeAllData(); setPin(''); } }]); setPin(''); return; }
      setError(true); setErrorMessage(result.error ?? 'Code incorrect');
    } finally { setValidating(false); }
  }, [pin, validatePin, onUnlock, wipeAllData, hapticEnabled]);

  const handleBiometric = async () => {
    if (isLockedOut()) return showLockoutAlert();
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Déverrouiller ONYX', cancelLabel: 'Utiliser le PIN', disableDeviceFallback: true });
      if (result.success) { if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); unlockWithBiometric(); onUnlock(); }
    } catch (_) {}
  };
  const handleNumberPress = (num: string) => { if (isLockedOut()) return showLockoutAlert(); if (pin.length < pinLength && !validating) setPin((prev) => prev + num); };
  const handleDeletePress = () => setPin((prev) => prev.slice(0, -1));
  const handleErrorAnimationComplete = () => { setError(false); setErrorMessage(''); setPin(''); };
  const showLockoutAlert = () => { Alert.alert('Compte temporairement bloqué', `Trop de tentatives échouées. Réessayez dans ${getLockoutRemainingSeconds()} seconde(s).`, [{ text: 'OK' }]); };
  const handleForgotPinPress = () => { Alert.alert('PIN oublié', 'Cela va effacer toutes les données de l\'application. Cette action est irréversible.', [{ text: 'Annuler', style: 'cancel' }, { text: 'Je comprends, continuer', style: 'destructive', onPress: () => setForgotPinStep(1) }]); };
  const handleWipeConfirm = async () => { if (wipeConfirmText.trim() !== 'EFFACER') return; await wipeAllData(); setForgotPinStep(0); setWipeConfirmText(''); };
  const locked = isLockedOut();

  if (forgotPinStep === 1) {
    const canConfirm = wipeConfirmText.trim() === 'EFFACER';
    return (
      <LinearGradient colors={colors.gradients.card} className="flex-1">
        <View className="flex-1 justify-center px-8">
          <View className="items-center mb-8"><View className="w-20 h-20 rounded-3xl items-center justify-center mb-4" style={{ backgroundColor: `${colors.accent.danger}18` }}><Shield size={36} color={colors.accent.danger} /></View><Text style={{ color: colors.text.primary, fontSize: 26, fontWeight: '700', textAlign: 'center' }}>Effacer les données</Text><Text style={{ color: colors.text.secondary, textAlign: 'center', marginTop: 8 }}>Tapez <Text style={{ color: colors.text.primary, fontWeight: '700' }}>EFFACER</Text> pour confirmer.</Text></View>
          <TextInput value={wipeConfirmText} onChangeText={setWipeConfirmText} placeholder="EFFACER" placeholderTextColor={colors.text.tertiary} autoCapitalize="characters" autoCorrect={false} className="px-4 py-3 rounded-xl text-base mb-6" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} />
          <View style={{ gap: 12 }}>
            <TouchableOpacity onPress={handleWipeConfirm} disabled={!canConfirm} className="py-4 rounded-xl items-center" style={{ backgroundColor: canConfirm ? colors.accent.danger : `${colors.accent.danger}55` }}><Text style={{ color: '#fff', fontWeight: '700' }}>Effacer définitivement</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setForgotPinStep(0); setWipeConfirmText(''); }} className="py-4 rounded-xl items-center" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Text style={{ color: colors.text.primary, fontWeight: '600' }}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: `${colors.accent.primary}18` }}><Shield size={40} color={colors.accent.primary} /></View>
          <Text style={{ color: colors.text.primary, fontSize: 34, fontWeight: '700', marginBottom: 8 }}>ONYX</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 15, textAlign: 'center' }}>{locked ? 'Compte temporairement bloqué' : 'Entrez votre code PIN'}</Text>
        </View>

        <View className="mb-12">
          <PinDots length={pinLength} filled={pin.length} error={error} onErrorAnimationComplete={handleErrorAnimationComplete} />
          {error && errorMessage ? <Text style={{ color: colors.accent.danger, textAlign: 'center', marginTop: 16, fontSize: 13 }}>{errorMessage}</Text> : failedAttempts > 0 && !locked ? <Text style={{ color: colors.accent.danger, textAlign: 'center', marginTop: 16, fontSize: 13 }}>{5 - failedAttempts} tentative(s) restante(s)</Text> : null}
        </View>

        <PinPad onNumberPress={handleNumberPress} onDeletePress={handleDeletePress} onBiometricPress={handleBiometric} showBiometric={biometricEnabled && biometricAvailable} disabled={locked} />

        {!locked ? (<TouchableOpacity onPress={handleForgotPinPress} className="mt-8 py-3"><Text style={{ color: colors.text.secondary, fontSize: 13 }}>PIN oublié ?</Text></TouchableOpacity>) : null}
      </View>
    </LinearGradient>
  );
}
