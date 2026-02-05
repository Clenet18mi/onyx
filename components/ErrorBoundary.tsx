// ============================================
// ONYX - Error Boundary
// Capture les erreurs React pour éviter les crashes
// ============================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Alert } from 'react-native';

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
    this.setState({
      error,
      errorInfo,
    });

    // En production, vous pouvez envoyer l'erreur à un service de logging
    // Ex: Sentry, Crashlytics, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // Forcer un rechargement de l'app
    // En React Native, on peut utiliser Updates.reloadAsync() d'Expo
    if (__DEV__) {
      Alert.alert('Rechargement', 'En développement, redémarrez l\'app manuellement');
    } else {
      // En production, vous pouvez utiliser expo-updates
      // import * as Updates from 'expo-updates';
      // Updates.reloadAsync();
      Alert.alert('Rechargement', 'Redémarrez l\'application');
    }
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
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
