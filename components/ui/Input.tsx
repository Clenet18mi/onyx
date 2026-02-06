// ============================================
// ONYX - Input Component (Premium)
// Label flottant, focus ring, erreur, clear
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Afficher un bouton clear quand il y a du texte */
  showClear?: boolean;
  /** Limite de caractères (affiche "restants") */
  maxLength?: number;
  onClear?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  success = false,
  leftIcon,
  rightIcon,
  showClear = false,
  maxLength,
  value,
  onFocus,
  onBlur,
  onChangeText,
  onClear,
  containerStyle,
  inputStyle,
  editable = true,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value && String(value).length > 0);
  const floating = focused || hasValue;

  const labelScale = useSharedValue(floating ? 0.85 : 1);
  const labelY = useSharedValue(floating ? -24 : 0);
  const borderOpacity = useSharedValue(0.3);
  const shakeX = useSharedValue(0);

  const updateLabel = useCallback(
    (float: boolean) => {
      labelScale.value = withSpring(float ? 0.85 : 1, { damping: 15 });
      labelY.value = withSpring(float ? -24 : 0, { damping: 15 });
    },
    [labelScale, labelY]
  );

  React.useEffect(() => {
    updateLabel(floating);
  }, [floating, updateLabel]);

  React.useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error]);

  const handleFocus = (e: any) => {
    setFocused(true);
    borderOpacity.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    borderOpacity.value = withTiming(0.3, { duration: 200 });
    onBlur?.(e);
  };

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  const borderColor = error
    ? colors.accent.danger
    : success
      ? colors.accent.success
      : focused
        ? colors.accent.primary
        : colors.text.tertiary;

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: labelY.value },
      { scale: labelScale.value },
    ],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const remaining = maxLength && value != null ? maxLength - String(value).length : null;

  return (
    <Animated.View style={[styles.wrapper, containerAnimatedStyle, containerStyle]}>
      <View
        style={[
          styles.container,
          {
            borderRadius: radius.sm,
            borderWidth: 2,
            borderColor,
            backgroundColor: colors.background.tertiary,
            paddingLeft: leftIcon ? spacing.sm : spacing.md,
            paddingRight: (rightIcon || (showClear && hasValue)) ? spacing.sm : spacing.md,
            opacity: editable ? 1 : 0.6,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <View style={styles.inputRow}>
          <Animated.Text
            style={[
              styles.label,
              {
                color: error
                  ? colors.accent.danger
                  : focused
                    ? colors.accent.primary
                    : colors.text.tertiary,
                fontSize: floating ? 12 : 16,
              },
              labelAnimatedStyle,
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder=""
            placeholderTextColor={colors.text.tertiary}
            style={[
              styles.input,
              {
                color: colors.text.primary,
                paddingTop: 18,
                paddingBottom: 14,
                paddingLeft: 0,
                paddingRight: 0,
              },
              inputStyle,
            ]}
            editable={editable}
            maxLength={maxLength}
            accessibilityLabel={label}
            accessibilityState={{ disabled: !editable }}
            {...props}
          />
        </View>
        {showClear && hasValue && editable && (
          <Pressable
            onPress={handleClear}
            hitSlop={12}
            style={styles.clearBtn}
            accessibilityLabel="Effacer"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.text.tertiary, fontSize: 18 }}>✕</Text>
          </Pressable>
        )}
        {rightIcon && !(showClear && hasValue) && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      {error && (
        <Text style={[styles.message, { color: colors.accent.danger }]} numberOfLines={1}>
          {error}
        </Text>
      )}
      {remaining != null && remaining <= 40 && !error && (
        <Text style={[styles.remaining, { color: theme.colors.text.tertiary }]}>
          {remaining} caractères restants
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  inputRow: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 18,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  message: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  remaining: {
    fontSize: 11,
    marginTop: 2,
    marginLeft: 4,
  },
});
