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
import { useTheme } from '@/hooks/useTheme';
import { LockScreen, SetupPinScreen } from '@/components/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { storageHelper } from '@/utils/storage';
import { runMigrations } from '@/utils/migrations';
import { startPersistOnChange, areAllStoresHydrated } from '@/utils/persistStores';
import { setReminderNotificationHandler, syncReminderNotifications } from '@/utils/reminderNotifications';
import { useReminderStore } from '@/stores';
import '../global.css';

// Garder le splash screen visible pendant le chargement
SplashScreen.preventAutoHideAsync();

// Afficher les notifications de rappels même quand l'app est au premier plan
setReminderNotificationHandler();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [storesHydrated, setStoresHydrated] = useState(false);
  const { theme } = useTheme();
  const { isSetup, isAuthenticated } = useAuthStore();
  const processSubscriptions = useSubscriptionStore((state) => state.processSubscriptions);
  const bgColor = theme.colors.background.primary;
  const isDark = theme.colors.background.primary === '#0A0A0F';

  // Charger les fonts
  const [fontsLoaded] = useFonts({
    // Ajoutez vos fonts personnalisées ici si nécessaire
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[ONYX] Initializing app...');

        await storageHelper.initialize();

        try {
          const migrationResult = await runMigrations();
          if (!migrationResult.success) {
            console.warn('[ONYX] Some migrations failed');
          } else {
            console.log('[ONYX] Migrations completed');
          }
        } catch (migrationError) {
          console.error('[ONYX] Migration error:', migrationError);
        }
        
        // Zustand persist gère automatiquement la persistance
        try {
          startPersistOnChange();
          console.log('[ONYX] Persist system started');
        } catch (persistError) {
          console.error('[ONYX] Persist system error:', persistError);
        }
        
        // Attendre que tous les stores soient hydratés
        let hydrationChecked = false;
        const checkHydration = setInterval(() => {
          try {
            if (areAllStoresHydrated()) {
              clearInterval(checkHydration);
              hydrationChecked = true;
              console.log('[ONYX] All stores hydrated');
              setStoresHydrated(true);
              try {
                processSubscriptions();
              } catch (subError) {
                console.error('[ONYX] Process subscriptions error:', subError);
              }
              syncReminderNotifications(useReminderStore.getState().reminders).catch((syncError) => {
                console.warn('[ONYX] Reminder notifications sync error:', syncError);
              });
            }
          } catch (hydrationError) {
            console.error('[ONYX] Hydration check error:', hydrationError);
            clearInterval(checkHydration);
            setStoresHydrated(true);
          }
        }, 50);
        
        // Timeout de sécurité après 3 secondes
        setTimeout(() => {
          if (!hydrationChecked) {
            clearInterval(checkHydration);
            console.warn('[ONYX] Hydration timeout, continuing anyway');
            setStoresHydrated(true);
            try {
              processSubscriptions();
            } catch (subError) {
              console.error('[ONYX] Process subscriptions error:', subError);
            }
          }
        }, 3000);
      } catch (e) {
        console.error('[ONYX] Fatal initialization error:', e);
        // Même en cas d'erreur, on continue pour afficher l'UI
        setStoresHydrated(true);
      } finally {
        setAppIsReady(true);
        console.log('[ONYX] App ready');
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  if (!appIsReady || !fontsLoaded || !storesHydrated) {
    return null;
  }

  // Premier lancement - Configuration du PIN
  if (!isSetup) {
    return (
      <ErrorBoundary>
        <View className="flex-1" style={{ backgroundColor: bgColor }}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
          <SetupPinScreen onComplete={() => {}} />
        </View>
      </ErrorBoundary>
    );
  }

  // Non authentifié - Écran de verrouillage
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <View className="flex-1" style={{ backgroundColor: bgColor }}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
          <LockScreen onUnlock={() => {}} />
        </View>
      </ErrorBoundary>
    );
  }

  // Authentifié - Navigation principale
  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: bgColor }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bgColor },
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
          name="transaction/[id]" 
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
        <Stack.Screen name="period-comparator" />
        <Stack.Screen name="scenarios" />
      </Stack>
      </View>
    </ErrorBoundary>
  );
}
