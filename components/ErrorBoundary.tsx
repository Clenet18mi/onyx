// ============================================
// ONYX - Error Boundary
// Capture les erreurs React pour éviter les crashes
// ============================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { setLastError } from '@/utils/debugLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ONYX] ErrorBoundary caught an error:', error, errorInfo);
    try {
      setLastError(error, { componentStack: errorInfo?.componentStack });
    } catch (_) {}
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    if (__DEV__) {
      Alert.alert('Rechargement', 'En développement, redémarrez l\'app manuellement');
    } else {
      Alert.alert('Rechargement', 'Redémarrez l\'application');
    }
  };

  handleResetData = () => {
    Alert.alert(
      'Réinitialiser les données',
      'Toutes les données (comptes, transactions, paramètres) seront effacées et l\'application redémarrera. À utiliser si l\'app plante après un import.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { storage } = await import('@/utils/storage');
              await storage.clearAll();
              const { useAuthStore } = await import('@/stores/authStore');
              useAuthStore.getState().resetAuth();
              this.setState({ hasError: false, error: null, errorInfo: null });
              Alert.alert(
                'Données effacées',
                'Fermez complètement l\'application (la quitter), puis rouvrez-la.',
                [{ text: 'OK' }]
              );
            } catch (e) {
              console.error('[ONYX] Reset data failed:', e);
              Alert.alert('Erreur', 'Impossible d\'effacer les données.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0B', padding: 20, justifyContent: 'center' }}>
          <ScrollView>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
              Oups ! Une erreur est survenue
            </Text>
            
            <Text style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 10 }}>
              L'application a rencontré une erreur inattendue.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={{ backgroundColor: '#1F1F23', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                  Détails de l'erreur (dev only):
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'monospace' }}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'monospace', marginTop: 10 }}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            {/* Toujours afficher le message d'erreur pour pouvoir déboguer après import */}
            {this.state.error && (
              <View style={{ backgroundColor: '#1F1F23', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                  Erreur :
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'monospace' }} selectable>
                  {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'monospace', marginTop: 8 }} selectable>
                    {this.state.error.stack.slice(0, 500)}
                  </Text>
                )}
              </View>
            )}

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={this.handleReset}
                style={{
                  backgroundColor: '#6366F1',
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  Réessayer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleReload}
                style={{
                  backgroundColor: '#3B82F6',
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  Recharger l'application
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleResetData}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#EF4444',
                }}
              >
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>
                  Réinitialiser les données (tout effacer)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
