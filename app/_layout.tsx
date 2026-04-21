// ============================================
// ONYX - Root Layout
// Layout principal avec protection d'authentification
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View, StatusBar, Alert, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore, usePlannedTransactionStore, useSettingsStore } from '@/stores';
import { useTheme } from '@/hooks/useTheme';
import { LockScreen, SetupPinScreen } from '@/components/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SplashLoader } from '@/components/ui/SplashLoader';
import { storageHelper } from '@/utils/storage';
import { runMigrations } from '@/utils/migrations';
import { startPersistOnChange, areAllStoresHydrated } from '@/utils/persistStores';
import { initDebugLogger, getLastError, clearLastError, type CapturedError } from '@/utils/debugLogger';
import '../global.css';

// Garder le splash screen visible pendant le chargement
SplashScreen.preventAutoHideAsync();

// Installer la capture d'erreurs globales AVANT tout rendu (pour capter le crash après import)
initDebugLogger();

/** Écran minimal (aucun store ni thème) si une erreur a été enregistrée au lancement précédent */
function CrashReportScreen({
  error,
  onContinue,
  onReset,
  onSafeMode,
}: {
  error: CapturedError;
  onContinue: () => void;
  onReset: () => void;
  onSafeMode: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0B', padding: 20 }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 24 }}>
        <Text style={{ color: '#EF4444', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
          Erreur au dernier lancement
        </Text>
        <Text style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 16 }}>
          L'app a planté (souvent après un import). Réinitialisez les données ou réessayez.
        </Text>
        <View style={{ backgroundColor: '#1F1F23', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'monospace' }} selectable>
            {error.message}
          </Text>
          {error.stack ? (
            <Text style={{ color: '#71717A', fontSize: 11, fontFamily: 'monospace', marginTop: 8 }} selectable>
              {error.stack.slice(0, 600)}
              {error.stack.length > 600 ? '…' : ''}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onReset}
          style={{ backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Réinitialiser les données</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onContinue}
          style={{ backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Continuer quand même</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSafeMode}
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Mode secours</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function RootLayoutContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [storesHydrated, setStoresHydrated] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const hasShownLateAlert = useRef(false);
  const router = useRouter();
  const { theme } = useTheme();
  const { isSetup, isAuthenticated } = useAuthStore();
  const safeModeEnabled = useSettingsStore((state) => state.safeModeEnabled);
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
              // Reminders/notifications restent gérés dans les stores de fond pour compat.
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
          }
        }, 3000);
      } catch (e) {
        console.error('[ONYX] Fatal initialization error:', e);
        setStoresHydrated(true);
      } finally {
        setAppIsReady(true);
        console.log('[ONYX] App ready');
      }
    }

    const preparePromise = prepare();
    // Forcer prêt à 10 s pour ne pas bloquer indéfiniment (l'écran de récupération à 5 s reste visible entre 5 et 10 s)
    const forceReady = setTimeout(() => {
      setAppIsReady(true);
      setStoresHydrated(true);
    }, 10000);
    preparePromise.finally(() => clearTimeout(forceReady));
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  useEffect(() => {
    if (appIsReady && fontsLoaded && storesHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady, fontsLoaded, storesHydrated]);

  // Si on reste bloqué sur l'écran de chargement (ex. après import corrompu), proposer de réinitialiser
  useEffect(() => {
    const loading = !appIsReady || !fontsLoaded || !storesHydrated;
    if (!loading) return;
    const t = setTimeout(() => setShowRecovery(true), 5000);
    return () => clearTimeout(t);
  }, [appIsReady, fontsLoaded, storesHydrated]);

  // Alerte une fois par session : transactions prévues en retard
  useEffect(() => {
    if (!storesHydrated || !isAuthenticated || hasShownLateAlert.current || safeModeEnabled) return;
    const overdue = usePlannedTransactionStore.getState().getOverdue();
    if (overdue.length === 0) return;
    hasShownLateAlert.current = true;
    const count = overdue.length;
    Alert.alert(
      'Transactions prévues en retard',
      `${count} transaction(s) prévue(s) sont en retard.\nVoulez-vous les consulter ?`,
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Voir', onPress: () => router.push('/(tabs)/') },
      ]
    );
  }, [storesHydrated, isAuthenticated, router]);

  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        const lock = useAuthStore.getState().lock;
        const autoLockDelay = useAuthStore.getState().autoLockDelay;
        const bg = backgroundTimeRef.current;
        if (autoLockDelay > 0 && bg != null) {
          const elapsed = (Date.now() - bg) / 1000 / 60;
          if (elapsed >= autoLockDelay) lock();
        }
        backgroundTimeRef.current = null;
      } else if (nextState.match(/inactive|background/)) {
        if (useAuthStore.getState().isAuthenticated) backgroundTimeRef.current = Date.now();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  if (!appIsReady || !fontsLoaded || !storesHydrated) {
    return (
      <ErrorBoundary>
        <View className="flex-1" style={{ backgroundColor: bgColor }}>
          <StatusBar barStyle="light-content" backgroundColor={bgColor} />
          {showRecovery ? (
            <View className="flex-1 justify-center items-center px-8" style={{ backgroundColor: '#0A0A0B' }}>
              <Text className="text-white text-xl font-bold text-center mb-4">
                L'application ne charge pas
              </Text>
              <Text className="text-white/80 text-center mb-6">
                Après un import, les données peuvent bloquer le démarrage. Réinitialisez pour repartir de zéro.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const { storage } = await import('@/utils/storage');
                    await storage.clearAll();
                    const { useAuthStore } = await import('@/stores/authStore');
                    useAuthStore.getState().resetAuth();
                    const { clearLastError } = await import('@/utils/debugLogger');
                    await clearLastError();
                    setShowRecovery(false);
                    setStoresHydrated(true);
                    setAppIsReady(true);
                    Alert.alert(
                      'Données effacées',
                      'Fermez complètement l\'application (la quitter), puis rouvrez-la.',
                      [{ text: 'OK' }]
                    );
                  } catch (e) {
                    console.error('[ONYX] Recovery reset failed:', e);
                    Alert.alert('Erreur', 'Impossible d\'effacer les données.', [{ text: 'OK' }]);
                  }
                }}
                className="py-4 px-6 rounded-xl mb-3"
                style={{ backgroundColor: '#EF4444' }}
              >
                <Text className="text-white font-semibold">Réinitialiser les données</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const { getLastError } = await import('@/utils/debugLogger');
                  const err = await getLastError();
                  if (err) {
                    Alert.alert('Dernière erreur enregistrée', err.message + (err.stack ? '\n\n' + err.stack.slice(0, 400) : ''), [{ text: 'OK' }]);
                  } else {
                    Alert.alert('Info', 'Aucune erreur enregistrée.');
                  }
                }}
                className="py-3 px-6 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Text className="text-white font-medium">Voir la dernière erreur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SplashLoader />
          )}
        </View>
      </ErrorBoundary>
    );
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
  const showSafeModeBanner = safeModeEnabled;
  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: bgColor }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
        {showSafeModeBanner ? (
          <View style={{ backgroundColor: '#7C2D12', paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ color: '#FFF7ED', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
              Mode secours activé
            </Text>
          </View>
        ) : null}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bgColor ?? '#0A0A0F' },
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
          name="settings" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>
      </View>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const [lastError, setLastError] = useState<CapturedError | null>(null);
  const [errorCheckDone, setErrorCheckDone] = useState(false);

  useEffect(() => {
    initDebugLogger();
    getLastError().then((e) => {
      setLastError(e ?? null);
      setErrorCheckDone(true);
    });
  }, []);

  useEffect(() => {
    if (errorCheckDone && lastError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [errorCheckDone, lastError]);

  if (!errorCheckDone) {
    return null;
  }
  if (lastError) {
    return (
      <CrashReportScreen
        error={lastError}
        onContinue={async () => {
          await clearLastError();
          setLastError(null);
        }}
        onSafeMode={async () => {
          const { useSettingsStore } = await import('@/stores/settingsStore');
          useSettingsStore.getState().setSafeModeEnabled(true);
          await clearLastError();
          setLastError(null);
        }}
        onReset={async () => {
          try {
            const { storage } = await import('@/utils/storage');
            await storage.clearAll();
            const { useAuthStore } = await import('@/stores/authStore');
            useAuthStore.getState().resetAuth();
            await clearLastError();
            setLastError(null);
            Alert.alert(
              'Données effacées',
              'Fermez complètement l\'application (la quitter), puis rouvrez-la.',
              [{ text: 'OK' }]
            );
          } catch (e) {
            Alert.alert('Erreur', 'Impossible d\'effacer les données.');
          }
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <RootLayoutContent />
    </ErrorBoundary>
  );
}
