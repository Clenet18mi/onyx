// ============================================
// ONYX - Animated Number
// Compte animé (montants, soldes)
// ============================================

import React, { useEffect } from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { formatCurrency } from '@/utils/format';

export interface AnimatedNumberProps extends TextProps {
  value: number;
  currency?: string;
  locale?: string;
  /** Durée de l'animation (ms) */
  duration?: number;
  /** Formater en devise (sinon nombre brut) */
  formatAsCurrency?: boolean;
  /** Préfixe (ex: "+", "-") */
  prefix?: string;
  /** Suffixe (ex: " €") */
  suffix?: string;
}

export function AnimatedNumber({
  value,
  currency = 'EUR',
  locale = 'fr-FR',
  duration = 600,
  formatAsCurrency = true,
  prefix = '',
  suffix = '',
  style,
  ...props
}: AnimatedNumberProps) {
  const displayValue = useSharedValue(value);
  const [displayText, setDisplayText] = React.useState(() =>
    formatAsCurrency ? formatCurrency(value, currency, locale) : String(value)
  );

  useAnimatedReaction(
    () => displayValue.value,
    (v) => {
      const str = formatAsCurrency
        ? formatCurrency(v, currency, locale)
        : Math.round(v).toString();
      runOnJS(setDisplayText)(prefix + str + suffix);
    },
    [formatAsCurrency, currency, locale, prefix, suffix]
  );

  useEffect(() => {
    displayValue.value = withTiming(value, {
      duration,
    });
  }, [value, duration]);

  return (
    <Text style={[styles.text, style]} {...props}>
      {displayText}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {},
});
