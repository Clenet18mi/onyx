// ============================================
// ONYX - Lock Screen Component
// Écran de verrouillage avec PIN + Biométrie
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Lock } from 'lucide-react-native';
import { useAuthStore } from '@/stores';
import { PinPad } from './PinPad';
import { PinDots } from './PinDots';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    pinLength,
    biometricEnabled,
    verifyAndUnlock,
    unlockWithBiometric,
    failedAttempts,
    lockoutUntil,
    isLockedOut,
  } = useAuthStore();

  // Vérifier la disponibilité de la biométrie
  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  // Authentification biométrique automatique au montage
  useEffect(() => {
    if (biometricEnabled && biometricAvailable && !isLockedOut()) {
      handleBiometric();
    }
  }, [biometricAvailable, biometricEnabled]);

  // Vérifier le PIN quand il est complet
  useEffect(() => {
    if (pin.length === pinLength) {
      verifyPin();
    }
  }, [pin]);

  const verifyPin = useCallback(() => {
    const isValid = verifyAndUnlock(pin);
    if (isValid) {
      onUnlock();
    } else {
      setError(true);
    }
  }, [pin, verifyAndUnlock, onUnlock]);

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
    } catch (error) {
      console.log('Biometric error:', error);
    }
  };

  const handleNumberPress = (num: string) => {
    if (isLockedOut()) {
      showLockoutAlert();
      return;
    }
    if (pin.length < pinLength) {
      setPin((prev) => prev + num);
    }
  };

  const handleDeletePress = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleErrorAnimationComplete = () => {
    setError(false);
    setPin('');
  };

  const showLockoutAlert = () => {
    if (lockoutUntil) {
      const timeLeft = formatDistanceToNow(parseISO(lockoutUntil), {
        locale: fr,
        addSuffix: false,
      });
      Alert.alert(
        'Compte temporairement bloqué',
        `Trop de tentatives échouées. Réessayez dans ${timeLeft}.`,
        [{ text: 'OK' }]
      );
    }
  };

  const locked = isLockedOut();

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo & Titre */}
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

        {/* PIN Dots */}
        <View className="mb-12">
          <PinDots
            length={pinLength}
            filled={pin.length}
            error={error}
            onErrorAnimationComplete={handleErrorAnimationComplete}
          />
          
          {/* Message d'erreur */}
          {failedAttempts > 0 && !locked && (
            <Text className="text-red-500 text-center mt-4 text-sm">
              {5 - failedAttempts} tentative(s) restante(s)
            </Text>
          )}
        </View>

        {/* PIN Pad */}
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
