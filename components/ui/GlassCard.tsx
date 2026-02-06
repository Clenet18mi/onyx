// ============================================
// ONYX - Glass Card Component (Premium)
// Cartes glassmorphism avec variantes, blur, shimmer
// ============================================

import React, { useEffect } from 'react';
import { View, Pressable, ViewStyle, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

type GlassCardVariant = 'default' | 'elevated' | 'outlined' | 'gradient';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassCardVariant | 'light';
  /** Dégradé personnalisé [start, end] (optionnel) */
  gradient?: [string, string];
  /** Intensité du blur (0 = pas de blur, 20–40 recommandé) */
  blur?: number;
  /** Padding interne (theme.spacing) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** @deprecated Utiliser padding="none" */
  noPadding?: boolean;
  onPress?: () => void;
  /** État chargement avec effet shimmer */
  loading?: boolean;
  style?: ViewStyle;
  className?: string;
}


export function GlassCard({
  children,
  variant: variantProp = 'default',
  gradient: customGradient,
  blur = 0,
  padding: paddingProp = 'md',
  noPadding,
  onPress,
  loading = false,
  style,
  className = '',
}: GlassCardProps) {
  const { theme, isDark } = useTheme();
  const { colors, radius, spacing: space, shadows } = theme;
  const shimmerX = useSharedValue(-200);

  const variant = variantProp === 'light' ? 'elevated' : variantProp;
  const padding = noPadding ? 'none' : paddingProp;

  useEffect(() => {
    if (loading) {
      shimmerX.value = -200;
      shimmerX.value = withRepeat(
        withTiming(400, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    } else {
      cancelAnimation(shimmerX);
    }
    return () => cancelAnimation(shimmerX);
  }, [loading]);

  const paddingValue =
    padding === 'none' ? 0 : padding === 'sm' ? space.sm : padding === 'lg' ? space.lg : space.md;
  const borderRadius = radius.lg;

  const gradientBorder = customGradient ?? colors.gradients.primary;
  const cardGradient = variant === 'gradient' ? gradientBorder : (colors.gradients.card as [string, string]);

  const variants = {
    default: {
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      shadow: undefined as ViewStyle['shadowColor'],
      backgroundColor: colors.background.card,
    },
    elevated: {
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: shadows.md,
      backgroundColor: colors.background.card,
    },
    outlined: {
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.3)',
      shadow: undefined,
      backgroundColor: 'transparent',
    },
    gradient: {
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: shadows.colored,
      backgroundColor: 'transparent',
    },
  };

  const v = variants[variant];

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const content = (
    <>
      {blur > 0 ? (
        <BlurView
          intensity={Platform.OS === 'android' ? Math.min(blur, 80) : blur}
          tint={isDark ? 'dark' : 'light'}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius, overflow: 'hidden' },
          ]}
        />
      ) : null}
      {variant === 'gradient' ? (
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      ) : blur === 0 ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius, backgroundColor: v.backgroundColor },
          ]}
        />
      ) : null}
      {/* Bordure en dégradé (fine ligne en overlay) */}
      {variant === 'outlined' && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              borderWidth: 2,
              borderColor: v.borderColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
      {variant !== 'outlined' && variant !== 'gradient' && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              borderWidth: v.borderWidth,
              borderColor: v.borderColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
      <View style={{ padding: paddingValue, zIndex: 1 }}>{children}</View>
      {loading && (
        <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]} pointerEvents="none">
          <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]}>
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.15)',
                'rgba(255,255,255,0.08)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      )}
    </>
  );

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    ...(v.shadow && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    }),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          style,
        ]}
        className={className}
        accessibilityRole="button"
        accessibilityLabel="Carte cliquable"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]} className={className}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
  },
});
