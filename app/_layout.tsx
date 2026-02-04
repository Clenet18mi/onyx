// ============================================
// ONYX - Root Layout
// Layout principal avec protection d'authentification
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore, useSubscriptionStore } from '@/stores';
import { LockScreen, SetupPinScreen } from '@/components/auth';
import { storage, flushPendingWrites } from '@/utils/storage';
import { runMigrations } from '@/utils/migrations';
import '../global.css';

// Garder le splash screen visible pendant le chargement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  
  const { isSetup, isAuthenticated } = useAuthStore();
  const processSubscriptions = useSubscriptionStore((state) => state.processSubscriptions);

  // Charger les fonts
  const [fontsLoaded] = useFonts({
    // Ajoutez vos fonts personnalisées ici si nécessaire
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Initialiser le stockage (obligatoire si fallback AsyncStorage)
        await storage.initialize();
        // Exécuter les migrations de données si nécessaire
        const migrationResult = runMigrations();
        if (!migrationResult.success) {
          console.warn('[ONYX] Some migrations failed');
        }
        // Traiter les abonnements en attente
        processSubscriptions();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  // À chaque passage en arrière-plan : attendre que toutes les écritures soient bien enregistrées
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextState.match(/inactive|background/)) {
        flushPendingWrites();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  // Premier lancement - Configuration du PIN
  if (!isSetup) {
    return (
      <View className="flex-1 bg-onyx">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
        <SetupPinScreen onComplete={() => {}} />
      </View>
    );
  }

  // Non authentifié - Écran de verrouillage
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-onyx">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
        <LockScreen onUnlock={() => {}} />
      </View>
    );
  }

  // Authentifié - Navigation principale
  return (
    <View className="flex-1 bg-onyx">
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0B' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="account/[id]" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="transaction/add" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="transfer" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="goal/[id]" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="subscription/[id]" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>
    </View>
  );
}
