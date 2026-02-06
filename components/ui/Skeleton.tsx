// ============================================
// ONYX - Skeleton loader
// Shimmer / pulse pour états de chargement
// ============================================

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.text.tertiary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.background.card }]}>
      <Skeleton height={24} width="60%" style={{ marginBottom: 12 }} />
      <Skeleton height={16} width="90%" style={{ marginBottom: 8 }} />
      <Skeleton height={16} width="70%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
});
