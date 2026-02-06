// ============================================
// ONYX - Button Component (Premium)
// Variantes, tailles, haptic, scale animation, loading
// ============================================

import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { hapticLight } from '@/utils/haptics';
import { useSettingsStore } from '@/stores';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** @deprecated Utiliser iconLeft */
  icon?: React.ReactNode;
  /** Si true, seul l'icône est affichée (title ignoré) */
  iconOnly?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const sizeConfig = {
  sm: { py: 10, px: 16, fontSize: 14, gap: 6 },
  md: { py: 12, px: 24, gap: 8 },
  lg: { py: 16, px: 32, fontSize: 18, gap: 10 },
  xl: { py: 20, px: 40, fontSize: 18, gap: 10 },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  icon,
  iconOnly = false,
  fullWidth = false,
  disabled,
  onPress,
  style,
  children,
  ...props
}: ButtonProps) {
  const leftIcon = iconLeft ?? icon;
  const { theme, isDark } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const { colors, radius } = theme;

  const handlePress = (e: any) => {
    if (hapticEnabled) hapticLight();
    onPress?.(e);
  };

  const config = sizeConfig[size];
  const fontSize = config.fontSize ?? 16;
  const py = config.py;
  const px = config.px;
  const gap = config.gap ?? 8;

  const variantConfig = {
    primary: {
      gradient: colors.gradients.primary,
      textColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: 'transparent',
      useGradient: true,
    },
    secondary: {
      gradient: colors.gradients.card,
      textColor: colors.text.primary,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      useGradient: false,
    },
    ghost: {
      gradient: ['transparent', 'transparent'] as [string, string],
      textColor: colors.text.primary,
      borderWidth: 0,
      borderColor: 'transparent',
      useGradient: false,
    },
    danger: {
      gradient: colors.gradients.danger,
      textColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: 'transparent',
      useGradient: true,
    },
    success: {
      gradient: colors.gradients.success,
      textColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: 'transparent',
      useGradient: true,
    },
  };

  const v = variantConfig[variant];
  const borderColor =
    variant === 'secondary'
      ? isDark
        ? 'rgba(255,255,255,0.2)'
        : 'rgba(99,102,241,0.5)'
      : v.borderColor;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={v.textColor}
          style={styles.loader}
        />
      ) : (
        <>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          {(title != null && title !== '' && !iconOnly) || children ? (
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  fontSize,
                  color: v.textColor,
                  marginLeft: leftIcon ? gap : 0,
                  marginRight: iconRight ? gap : 0,
                },
              ]}
            >
              {children ?? title}
            </Text>
          ) : null}
          {iconRight && <View style={styles.icon}>{iconRight}</View>}
        </>
      )}
    </>
  );

  const inner = v.useGradient ? (
    <LinearGradient
      colors={v.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.inner,
        {
          paddingVertical: py,
          paddingHorizontal: iconOnly ? py : px,
          borderRadius: radius.md,
          borderWidth: v.borderWidth,
          borderColor,
        },
      ]}
    >
      {content}
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.inner,
        {
          paddingVertical: py,
          paddingHorizontal: iconOnly ? py : px,
          borderRadius: radius.md,
          backgroundColor: variant === 'ghost' ? 'transparent' : theme.colors.background.tertiary,
          borderWidth: v.borderWidth,
          borderColor,
        },
      ]}
    >
      {content}
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.outer,
        fullWidth && styles.fullWidth,
        {
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style as any,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={title ?? (iconOnly ? 'Bouton' : undefined)}
      {...props}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    margin: 0,
  },
  label: {
    fontWeight: '600',
  },
  loader: {
    marginVertical: 2,
  },
});
