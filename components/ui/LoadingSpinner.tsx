// ============================================
// ONYX - Loading Spinner
// ============================================

import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message, size = 'large' }: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size={size} color="#6366F1" />
      {message ? (
        <Text className="text-onyx-500 mt-4 text-sm">{message}</Text>
      ) : null}
    </View>
  );
}
