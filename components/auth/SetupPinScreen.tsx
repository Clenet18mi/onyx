import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, ChevronRight, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useSettingsStore } from '@/stores';
import { PinPad } from './PinPad';
import { PinDots } from './PinDots';
import { Button } from '../ui/Button';
import { useTheme } from '@/hooks/useTheme';

interface SetupPinScreenProps { onComplete: () => void; }
type SetupStep = 'welcome' | 'choose-length' | 'enter-pin' | 'confirm-pin' | 'biometric';

export function SetupPinScreen({ onComplete }: SetupPinScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [step, setStep] = useState<SetupStep>('welcome');
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { setupPin, enableBiometric } = useAuthStore();
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  useEffect(() => { (async () => { const compatible = await LocalAuthentication.hasHardwareAsync(); const enrolled = await LocalAuthentication.isEnrolledAsync(); setBiometricAvailable(compatible && enrolled); })(); }, []);
  useEffect(() => { if (step === 'confirm-pin' && confirmPin.length === pinLength) { if (confirmPin === pin) { if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); if (biometricAvailable) setStep('biometric'); else finishSetup(false); } else setError(true); } }, [confirmPin, step, pinLength, pin, biometricAvailable]);
  useEffect(() => { if (step === 'enter-pin' && pin.length === pinLength) { if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setTimeout(() => setStep('confirm-pin'), 300); } }, [pin, step, pinLength, hapticEnabled]);

  const handleNumberPress = (num: string) => { if (step === 'enter-pin' && pin.length < pinLength) setPin((prev) => prev + num); else if (step === 'confirm-pin' && confirmPin.length < pinLength) setConfirmPin((prev) => prev + num); };
  const handleDeletePress = () => { if (step === 'enter-pin') setPin((prev) => prev.slice(0, -1)); else if (step === 'confirm-pin') setConfirmPin((prev) => prev.slice(0, -1)); };
  const handleErrorAnimationComplete = () => { setError(false); setConfirmPin(''); };
  const finishSetup = async (withBiometric: boolean) => { await setupPin(pin, pinLength); enableBiometric(withBiometric); onComplete(); };
  const handleBiometricSetup = async () => { try { const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Activer la biométrie pour ONYX', cancelLabel: 'Ignorer', disableDeviceFallback: true }); finishSetup(result.success); } catch { finishSetup(false); } };

  if (step === 'welcome') {
    return (<LinearGradient colors={colors.gradients.card} className="flex-1 justify-center items-center px-8"><View className="w-24 h-24 rounded-3xl items-center justify-center mb-8" style={{ backgroundColor: `${colors.accent.primary}18` }}><Shield size={48} color={colors.accent.primary} /></View><Text style={{ color: colors.text.primary, fontSize: 38, fontWeight: '700', marginBottom: 12 }}>ONYX</Text><Text style={{ color: colors.text.secondary, fontSize: 16, textAlign: 'center', marginBottom: 28 }}>Votre gestionnaire de finances personnelles, privé et sécurisé.</Text><Button title="Commencer" variant="primary" size="lg" fullWidth onPress={() => setStep('choose-length')} icon={<ChevronRight size={20} color="white" />} /></LinearGradient>);
  }

  if (step === 'choose-length') {
    return (<LinearGradient colors={colors.gradients.card} className="flex-1 justify-center items-center px-8"><Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>Sécurité</Text><Text style={{ color: colors.text.secondary, fontSize: 15, textAlign: 'center', marginBottom: 32 }}>Choisissez la longueur de votre code PIN</Text><View className="w-full mb-8" style={{ gap: 16 }}><TouchableOpacity onPress={() => { setPinLength(4); setStep('enter-pin'); }} className="w-full rounded-2xl p-6" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>4 chiffres</Text><Text style={{ color: colors.text.secondary }}>Rapide et pratique</Text></TouchableOpacity><TouchableOpacity onPress={() => { setPinLength(6); setStep('enter-pin'); }} className="w-full rounded-2xl p-6" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>6 chiffres</Text><Text style={{ color: colors.text.secondary }}>Plus sécurisé</Text></TouchableOpacity></View></LinearGradient>);
  }

  if (step === 'enter-pin') {
    return (<LinearGradient colors={colors.gradients.card} className="flex-1 justify-center items-center px-8"><Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>Créer votre code PIN</Text><Text style={{ color: colors.text.secondary, fontSize: 15, textAlign: 'center', marginBottom: 32 }}>Choisissez un code à {pinLength} chiffres</Text><View className="mb-12"><PinDots length={pinLength} filled={pin.length} /></View><PinPad onNumberPress={handleNumberPress} onDeletePress={handleDeletePress} showBiometric={false} /></LinearGradient>);
  }

  if (step === 'confirm-pin') {
    return (<LinearGradient colors={colors.gradients.card} className="flex-1 justify-center items-center px-8"><Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>Confirmer votre code PIN</Text><Text style={{ color: colors.text.secondary, fontSize: 15, textAlign: 'center', marginBottom: 32 }}>Entrez à nouveau votre code</Text><View className="mb-12"><PinDots length={pinLength} filled={confirmPin.length} error={error} onErrorAnimationComplete={handleErrorAnimationComplete} />{error ? <Text style={{ color: colors.accent.danger, textAlign: 'center', marginTop: 16, fontSize: 13 }}>Les codes ne correspondent pas</Text> : null}</View><PinPad onNumberPress={handleNumberPress} onDeletePress={handleDeletePress} showBiometric={false} /></LinearGradient>);
  }

  if (step === 'biometric') {
    return (<LinearGradient colors={colors.gradients.card} className="flex-1 justify-center items-center px-8"><View className="w-24 h-24 rounded-3xl items-center justify-center mb-8" style={{ backgroundColor: `${colors.accent.primary}18` }}><Fingerprint size={48} color={colors.accent.primary} /></View><Text style={{ color: colors.text.primary, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>Biométrie</Text><Text style={{ color: colors.text.secondary, fontSize: 15, textAlign: 'center', marginBottom: 32 }}>Déverrouillez ONYX plus rapidement avec votre empreinte ou Face ID</Text><View className="w-full" style={{ gap: 16 }}><Button title="Activer la biométrie" variant="primary" size="lg" fullWidth onPress={handleBiometricSetup} icon={<Fingerprint size={20} color="white" />} /><Button title="Plus tard" variant="ghost" size="lg" fullWidth onPress={() => finishSetup(false)} /></View></LinearGradient>);
  }

  return null;
}
