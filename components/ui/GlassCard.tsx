// ============================================
// ONYX - Glass Card Component
// Carte avec effet Glassmorphism
// ============================================

import React from 'react';
import { View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'light' | 'dark';
  noPadding?: boolean;
}

export function GlassCard({ 
  children, 
  variant = 'default', 
  noPadding = false,
  className = '',
  ...props 
}: GlassCardProps) {
  const variants = {
    default: {
      colors: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'],
      borderColor: 'rgba(255,255,255,0.1)',
    },
    light: {
      colors: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'],
      borderColor: 'rgba(255,255,255,0.15)',
    },
    dark: {
      colors: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.2)'],
      borderColor: 'rgba(255,255,255,0.05)',
    },
  };

  const { colors, borderColor } = variants[variant];

  return (
    <View
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{ borderWidth: 1, borderColor }}
      {...props}
    >
      <LinearGradient
        colors={colors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={noPadding ? '' : 'p-4'}
      >
        {children}
      </LinearGradient>
    </View>
  );
}
