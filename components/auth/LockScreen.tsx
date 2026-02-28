// ============================================
// ONYX - Lock Screen Component
// PIN (hash SHA-256) + Biométrie + limitation tentatives
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Shield } from 'lucide-react-native';
import { useAuthStore, useSettingsStore } from '@/stores';
import { PinPad } from './PinPad';
import { PinDots } from './PinDots';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [validating, setValidating] = useState(false);
  /** 0 = normal, 1 = taper EFFACER */
  const [forgotPinStep, setForgotPinStep] = useState<0 | 1>(0);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  const {
    pinLength,
    biometricEnabled,
    validatePin,
    unlockWithBiometric,
    failedAttempts,
    lockoutUntil,
    isLockedOut,
    getLockoutRemainingSeconds,
    wipeAllData,
  } = useAuthStore();
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  useEffect(() => {
    if (biometricEnabled && biometricAvailable && !isLockedOut()) {
      handleBiometric();
    }
  }, [biometricAvailable, biometricEnabled]);

  useEffect(() => {
    if (pin.length === pinLength && !validating) {
      verifyPin();
    }
  }, [pin, pinLength, validating, verifyPin]);

  const verifyPin = useCallback(async () => {
    setValidating(true);
    setError(false);
    setErrorMessage('');
    try {
      const result = await validatePin(pin);
      if (result.success) {
        if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onUnlock();
        return;
      }
      if (result.shouldWipe) {
        Alert.alert(
          'Sécurité',
          'Trop de tentatives. Effacement des données pour protéger votre vie privée.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await wipeAllData();
                setPin('');
              },
            },
          ]
        );
        setPin('');
        setValidating(false);
        return;
      }
      setError(true);
      setErrorMessage(result.error ?? 'Code incorrect');
    } finally {
      setValidating(false);
    }
  }, [pin, validatePin, onUnlock, wipeAllData]);

  const handleBiometric = async () => {
    if (isLockedOut()) {
      showLockoutAlert();
      return;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Déverrouiller ONYX',
        cancelLabel: 'Utiliser le PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        unlockWithBiometric();
        onUnlock();
      }
    } catch (_) {}
  };

  const handleNumberPress = (num: string) => {
    if (isLockedOut()) {
      showLockoutAlert();
      return;
    }
    if (pin.length < pinLength && !validating) {
      setPin((prev) => prev + num);
    }
  };

  const handleDeletePress = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleErrorAnimationComplete = () => {
    setError(false);
    setErrorMessage('');
    setPin('');
  };

  const showLockoutAlert = () => {
    const remaining = getLockoutRemainingSeconds();
    Alert.alert(
      'Compte temporairement bloqué',
      `Trop de tentatives échouées. Réessayez dans ${remaining} seconde(s).`,
      [{ text: 'OK' }]
    );
  };

  const handleForgotPinPress = () => {
    Alert.alert(
      'PIN oublié',
      'Cela va effacer toutes les données de l\'application (comptes, transactions, budgets, etc.). Cette action est irréversible.\n\nSouhaitez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Je comprends, continuer',
          style: 'destructive',
          onPress: () => setForgotPinStep(1),
        },
      ]
    );
  };

  const handleWipeConfirm = async () => {
    if (wipeConfirmText.trim() !== 'EFFACER') return;
    await wipeAllData();
    setForgotPinStep(0);
    setWipeConfirmText('');
  };

  const locked = isLockedOut();

  // Étape 2–3 : taper EFFACER puis effacer définitivement
  if (forgotPinStep === 1) {
    const canConfirm = wipeConfirmText.trim() === 'EFFACER';
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
          <Text className="text-white text-xl font-bold mb-2">Effacer toutes les données</Text>
          <Text className="text-onyx-500 mb-6">
            Tapez <Text className="text-white font-semibold">EFFACER</Text> ci-dessous pour confirmer. Toutes vos données seront supprimées et vous devrez reconfigurer un nouveau code PIN.
          </Text>
          <TextInput
            value={wipeConfirmText}
            onChangeText={setWipeConfirmText}
            placeholder="EFFACER"
            placeholderTextColor="#52525B"
            autoCapitalize="characters"
            autoCorrect={false}
            className="bg-onyx-100 text-white px-4 py-3 rounded-xl text-base mb-6 border border-onyx-200/20"
          />
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleWipeConfirm}
              disabled={!canConfirm}
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: canConfirm ? '#EF4444' : 'rgba(239, 68, 68, 0.3)' }}
            >
              <Text className="text-white font-semibold">Effacer définitivement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setForgotPinStep(0);
                setWipeConfirmText('');
              }}
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Text className="text-white font-medium">Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-12">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
          >
            <Shield size={40} color="#6366F1" />
          </View>
          <Text className="text-white text-3xl font-bold mb-2">ONYX</Text>
          <Text className="text-onyx-500 text-base">
            {locked ? 'Compte temporairement bloqué' : 'Entrez votre code PIN'}
          </Text>
        </View>

        <View className="mb-12">
          <PinDots
            length={pinLength}
            filled={pin.length}
            error={error}
            onErrorAnimationComplete={handleErrorAnimationComplete}
          />
          {error && errorMessage ? (
            <Text className="text-red-500 text-center mt-4 text-sm">
              {errorMessage}
            </Text>
          ) : (
            failedAttempts > 0 &&
            !locked && (
              <Text className="text-red-500 text-center mt-4 text-sm">
                {5 - failedAttempts} tentative(s) restante(s)
              </Text>
            )
          )}
        </View>

        <PinPad
          onNumberPress={handleNumberPress}
          onDeletePress={handleDeletePress}
          onBiometricPress={handleBiometric}
          showBiometric={biometricEnabled && biometricAvailable}
          disabled={locked}
        />

        {!locked && (
          <TouchableOpacity
            onPress={handleForgotPinPress}
            className="mt-8 py-3"
          >
            <Text className="text-onyx-500 text-sm">PIN oublié ?</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}
