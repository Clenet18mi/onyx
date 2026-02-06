// ============================================
// ONYX - Toast / Snackbar
// Notification éphémère (success, error, info)
// ============================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  duration?: number;
}

const VARIANT_COLORS: Record<ToastVariant, string> = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export function Toast({
  visible,
  message,
  variant = 'info',
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const { theme } = useTheme();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1);
      const t = setTimeout(() => {
        translateY.value = withTiming(100);
        opacity.value = withTiming(0, {}, () => runOnJS(onDismiss)());
      }, duration);
      return () => clearTimeout(t);
    }
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const bgColor = VARIANT_COLORS[variant] + '20';
  const borderColor = VARIANT_COLORS[variant];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColor, borderLeftColor: borderColor },
        animatedStyle,
      ]}
    >
      <Text style={[styles.message, { color: theme.colors.text.primary }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
  },
});
