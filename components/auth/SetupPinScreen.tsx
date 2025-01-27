// ============================================
// ONYX - Setup PIN Screen
// Écran de configuration du PIN (premier lancement)
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, ChevronRight, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useSettingsStore } from '@/stores';
import { PinPad } from './PinPad';
import { PinDots } from './PinDots';
import { Button } from '../ui/Button';

interface SetupPinScreenProps {
  onComplete: () => void;
}

type SetupStep = 'welcome' | 'choose-length' | 'enter-pin' | 'confirm-pin' | 'biometric';

export function SetupPinScreen({ onComplete }: SetupPinScreenProps) {
  const [step, setStep] = useState<SetupStep>('welcome');
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const { setupPin, enableBiometric } = useAuthStore();
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  // Vérifier la disponibilité de la biométrie
  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  // Vérifier la confirmation du PIN
  useEffect(() => {
    if (step === 'confirm-pin' && confirmPin.length === pinLength) {
      if (confirmPin === pin) {
        if (hapticEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // Passer à l'étape biométrie ou terminer
        if (biometricAvailable) {
          setStep('biometric');
        } else {
          finishSetup(false);
        }
      } else {
        setError(true);
      }
    }
  }, [confirmPin]);

  // Passer à la confirmation quand le PIN est complet
  useEffect(() => {
    if (step === 'enter-pin' && pin.length === pinLength) {
      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setTimeout(() => setStep('confirm-pin'), 300);
    }
  }, [pin]);

  const handleNumberPress = (num: string) => {
    if (step === 'enter-pin' && pin.length < pinLength) {
      setPin((prev) => prev + num);
    } else if (step === 'confirm-pin' && confirmPin.length < pinLength) {
      setConfirmPin((prev) => prev + num);
    }
  };

  const handleDeletePress = () => {
    if (step === 'enter-pin') {
      setPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm-pin') {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleErrorAnimationComplete = () => {
    setError(false);
    setConfirmPin('');
  };

  const finishSetup = (withBiometric: boolean) => {
    setupPin(pin, pinLength);
    enableBiometric(withBiometric);
    onComplete();
  };

  const handleBiometricSetup = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Activer la biométrie pour ONYX',
        cancelLabel: 'Ignorer',
        disableDeviceFallback: true,
      });

      if (result.success) {
        finishSetup(true);
      } else {
        finishSetup(false);
      }
    } catch (error) {
      finishSetup(false);
    }
  };

  // Écran de bienvenue
  if (step === 'welcome') {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 justify-center items-center px-8"
      >
        <View 
          className="w-24 h-24 rounded-3xl items-center justify-center mb-8"
          style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
        >
          <Shield size={48} color="#6366F1" />
        </View>
        
        <Text className="text-white text-4xl font-bold mb-4">ONYX</Text>
        <Text className="text-onyx-500 text-lg text-center mb-8">
          Votre gestionnaire de finances personnelles, 100% privé et sécurisé.
        </Text>

        <View className="w-full space-y-4">
          <Button
            title="Commencer"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => setStep('choose-length')}
            icon={<ChevronRight size={20} color="white" />}
          />
        </View>
      </LinearGradient>
    );
  }

  // Choix de la longueur du PIN
  if (step === 'choose-length') {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 justify-center items-center px-8"
      >
        <Text className="text-white text-2xl font-bold mb-2">Sécurité</Text>
        <Text className="text-onyx-500 text-base text-center mb-12">
          Choisissez la longueur de votre code PIN
        </Text>

        <View className="w-full mb-8" style={{ gap: 16 }}>
          <TouchableOpacity
            onPress={() => {
              setPinLength(4);
              setStep('enter-pin');
            }}
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <Text className="text-white text-xl font-semibold mb-1">4 chiffres</Text>
            <Text className="text-onyx-500">Rapide et pratique</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPinLength(6);
              setStep('enter-pin');
            }}
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <Text className="text-white text-xl font-semibold mb-1">6 chiffres</Text>
            <Text className="text-onyx-500">Plus sécurisé</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Entrée du PIN
  if (step === 'enter-pin') {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 justify-center items-center px-8"
      >
        <Text className="text-white text-2xl font-bold mb-2">Créer votre code PIN</Text>
        <Text className="text-onyx-500 text-base text-center mb-12">
          Choisissez un code à {pinLength} chiffres
        </Text>

        <View className="mb-12">
          <PinDots length={pinLength} filled={pin.length} />
        </View>

        <PinPad
          onNumberPress={handleNumberPress}
          onDeletePress={handleDeletePress}
          showBiometric={false}
        />
      </LinearGradient>
    );
  }

  // Confirmation du PIN
  if (step === 'confirm-pin') {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 justify-center items-center px-8"
      >
        <Text className="text-white text-2xl font-bold mb-2">Confirmer votre code PIN</Text>
        <Text className="text-onyx-500 text-base text-center mb-12">
          Entrez à nouveau votre code
        </Text>

        <View className="mb-12">
          <PinDots
            length={pinLength}
            filled={confirmPin.length}
            error={error}
            onErrorAnimationComplete={handleErrorAnimationComplete}
          />
          {error && (
            <Text className="text-red-500 text-center mt-4 text-sm">
              Les codes ne correspondent pas
            </Text>
          )}
        </View>

        <PinPad
          onNumberPress={handleNumberPress}
          onDeletePress={handleDeletePress}
          showBiometric={false}
        />
      </LinearGradient>
    );
  }

  // Configuration biométrie
  if (step === 'biometric') {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 justify-center items-center px-8"
      >
        <View 
          className="w-24 h-24 rounded-3xl items-center justify-center mb-8"
          style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
        >
          <Fingerprint size={48} color="#6366F1" />
        </View>

        <Text className="text-white text-2xl font-bold mb-2">Biométrie</Text>
        <Text className="text-onyx-500 text-base text-center mb-12">
          Déverrouillez ONYX plus rapidement avec votre empreinte digitale ou Face ID
        </Text>

        <View className="w-full" style={{ gap: 16 }}>
          <Button
            title="Activer la biométrie"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleBiometricSetup}
            icon={<Fingerprint size={20} color="white" />}
          />
          
          <Button
            title="Plus tard"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => finishSetup(false)}
          />
        </View>
      </LinearGradient>
    );
  }

  return null;
}
