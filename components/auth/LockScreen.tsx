// ============================================
// ONYX - Lock Screen Component
// PIN (hash SHA-256) + Biométrie + limitation tentatives
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield } from 'lucide-react-native';
import { useAuthStore } from '@/stores';
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

  const locked = isLockedOut();

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
      </View>
    </LinearGradient>
  );
}
