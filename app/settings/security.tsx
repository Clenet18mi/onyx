// ============================================
// ONYX - Sécurité
// Changer PIN, biométrie, option effacement après 10 échecs
// ============================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAuthStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { PinPad } from '@/components/auth/PinPad';
import { PinDots } from '@/components/auth/PinDots';

type Step = 'menu' | 'current' | 'new' | 'confirm';

export default function SecurityScreen() {
  const router = useRouter();
  const {
    changePin,
    pinLength,
    biometricEnabled,
    enableBiometric,
    lock,
    wipeDataOnMaxFailures,
    setWipeDataOnMaxFailures,
  } = useAuthStore();

  const [step, setStep] = useState<Step>('menu');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnableWipeData = (value: boolean) => {
    if (value) {
      Alert.alert(
        '⚠️ Sécurité maximale',
        "Si cette option est activée, après 10 tentatives de PIN incorrectes, TOUTES vos données seront DÉFINITIVEMENT EFFACÉES.\n\nRecommandé uniquement si vous avez des backups réguliers.",
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer',
            style: 'destructive',
            onPress: () => setWipeDataOnMaxFailures(true),
          },
        ]
      );
    } else {
      setWipeDataOnMaxFailures(false);
    }
  };

  const onCurrentPinComplete = () => {
    if (currentPin.length === pinLength) setStep('new');
  };

  const onNewPinComplete = () => {
    if (newPin.length === pinLength) setStep('confirm');
  };

  const onSubmitChangePin = async () => {
    if (confirmPin !== newPin) {
      setError('Les deux codes ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await changePin(currentPin, newPin);
      if (ok) {
        Alert.alert('Succès', 'Votre code PIN a été modifié.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setError('Code actuel incorrect');
        setCurrentPin('');
        setStep('current');
      }
    } catch (_) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleNumberPress = (num: string) => {
    if (step === 'current' && currentPin.length < pinLength) {
      setCurrentPin((p) => p + num);
    } else if (step === 'new' && newPin.length < pinLength) {
      setNewPin((p) => p + num);
    } else if (step === 'confirm' && confirmPin.length < pinLength) {
      setConfirmPin((p) => p + num);
    }
  };

  const handleDeletePress = () => {
    if (step === 'current') setCurrentPin((p) => p.slice(0, -1));
    else if (step === 'new') setNewPin((p) => p.slice(0, -1));
    else if (step === 'confirm') setConfirmPin((p) => p.slice(0, -1));
  };

  React.useEffect(() => {
    if (step === 'current' && currentPin.length === pinLength) onCurrentPinComplete();
  }, [currentPin, step, pinLength]);

  React.useEffect(() => {
    if (step === 'new' && newPin.length === pinLength) onNewPinComplete();
  }, [newPin, step, pinLength]);

  if (step === 'current' || step === 'new' || step === 'confirm') {
    const isConfirm = step === 'confirm';
    const title =
      step === 'current'
        ? 'Entrez votre code actuel'
        : step === 'new'
          ? 'Nouveau code PIN'
          : 'Confirmez le nouveau code';
    const filled = step === 'current' ? currentPin.length : step === 'new' ? newPin.length : confirmPin.length;

    return (
      <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center px-6 py-4">
            <TouchableOpacity
              onPress={() => {
                setStep('menu');
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
                setError('');
              }}
              className="w-10 h-10 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Icons.ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">{title}</Text>
          </View>
          <View className="flex-1 justify-center items-center px-8">
            <View className="mb-8">
              <PinDots length={pinLength} filled={filled} error={!!error} />
              {error ? <Text className="text-red-500 text-center mt-4 text-sm">{error}</Text> : null}
            </View>
            {isConfirm && confirmPin.length === pinLength && (
              <TouchableOpacity
                onPress={onSubmitChangePin}
                disabled={loading}
                className="py-4 px-8 rounded-xl mb-6"
                style={{ backgroundColor: loading ? '#3F3F46' : '#6366F1' }}
              >
                <Text className="text-white font-semibold">{loading ? '...' : 'Valider'}</Text>
              </TouchableOpacity>
            )}
            <PinPad
              onNumberPress={handleNumberPress}
              onDeletePress={handleDeletePress}
              showBiometric={false}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23', '#0A0A0B']} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Sécurité</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <GlassCard noPadding className="mb-6">
            <TouchableOpacity
              onPress={() => setStep('current')}
              className="flex-row items-center justify-between p-4 border-b border-onyx-200/10"
            >
              <View className="flex-row items-center">
                <Icons.Lock size={20} color="#6366F1" />
                <Text className="text-white font-medium ml-3">Changer le code PIN</Text>
              </View>
              <Icons.ChevronRight size={20} color="#52525B" />
            </TouchableOpacity>
            <View className="flex-row items-center justify-between p-4 border-b border-onyx-200/10">
              <View>
                <Text className="text-white font-medium">Déverrouillage biométrique</Text>
                <Text className="text-onyx-500 text-sm">Empreinte ou Face ID</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={enableBiometric}
                trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                thumbColor="#fff"
              />
            </View>
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-1">
                <Text className="text-white font-medium">Effacer données après 10 échecs</Text>
                <Text className="text-onyx-500 text-sm">
                  Après 10 codes PIN incorrects, toutes les données sont supprimées
                </Text>
              </View>
              <Switch
                value={wipeDataOnMaxFailures}
                onValueChange={handleEnableWipeData}
                trackColor={{ false: '#3F3F46', true: '#EF4444' }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>

          <TouchableOpacity
            onPress={() => lock()}
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <Text className="text-white font-semibold">Verrouiller maintenant</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
