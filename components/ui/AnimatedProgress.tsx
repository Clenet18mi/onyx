// ============================================
// ONYX - Animated Progress
// Barre de progression avec remplissage animé
// ============================================

import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface AnimatedProgressProps {
  /** Valeur entre 0 et 1 (ou 0-100 si usePercentage) */
  progress: number;
  usePercentage?: boolean;
  height?: number;
  borderRadius?: number;
  /** Couleur de la barre (défaut: accent primary) */
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function AnimatedProgress({
  progress,
  usePercentage = false,
  height = 8,
  borderRadius,
  color,
  backgroundColor,
  style,
}: AnimatedProgressProps) {
  const { theme } = useTheme();
  const progressValue = useSharedValue(0);

  const normalized = usePercentage ? progress / 100 : Math.min(1, Math.max(0, progress));

  useEffect(() => {
    progressValue.value = withSpring(normalized, {
      damping: 18,
      stiffness: 120,
    });
  }, [normalized]);

  const fillColor = color ?? theme.colors.accent.primary;
  const trackColor = backgroundColor ?? theme.colors.background.tertiary;
  const radius = borderRadius ?? theme.radius.full;

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: radius,
          backgroundColor: trackColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: radius,
            backgroundColor: fillColor,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
