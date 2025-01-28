// ============================================
// ONYX - Button Component
// Bouton stylisé avec variantes
// ============================================

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  onPress,
  className = '',
  ...props
}: ButtonProps) {
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  const handlePress = (e: any) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const sizeClasses = {
    sm: 'py-2 px-4',
    md: 'py-3 px-6',
    lg: 'py-4 px-8',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const variantStyles = {
    primary: {
      gradient: ['#6366F1', '#8B5CF6'] as [string, string],
      textColor: 'text-white',
      opacity: disabled ? 0.5 : 1,
    },
    secondary: {
      gradient: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as [string, string],
      textColor: 'text-white',
      opacity: disabled ? 0.5 : 1,
    },
    ghost: {
      gradient: ['transparent', 'transparent'] as [string, string],
      textColor: 'text-onyx-600',
      opacity: disabled ? 0.5 : 1,
    },
    danger: {
      gradient: ['#EF4444', '#DC2626'] as [string, string],
      textColor: 'text-white',
      opacity: disabled ? 0.5 : 1,
    },
  };

  const { gradient, textColor, opacity } = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`rounded-2xl overflow-hidden ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ opacity }}
      {...props}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`flex-row items-center justify-center ${sizeClasses[size]}`}
        style={variant === 'secondary' ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' } : {}}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            {icon && <>{icon}</>}
            <Text className={`font-semibold ${textColor} ${textSizes[size]} ${icon ? 'ml-2' : ''}`}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
