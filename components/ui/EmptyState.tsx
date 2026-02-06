// ============================================
// ONYX - Empty State
// États vides illustrés (aucune transaction, etc.)
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { useTheme } from '@/hooks/useTheme';

export type EmptyStateVariant =
  | 'no_transactions'
  | 'no_accounts'
  | 'no_budgets'
  | 'no_goals'
  | 'search_no_results'
  | 'no_templates'
  | 'no_wishlist';

const VARIANTS: Record<
  EmptyStateVariant,
  { icon: string; title: string; description: string }
> = {
  no_transactions: {
    icon: '📝',
    title: 'Aucune transaction',
    description: 'Ajoutez votre première transaction pour commencer le suivi.',
  },
  no_accounts: {
    icon: '🏦',
    title: 'Aucun compte',
    description: 'Créez un compte pour suivre vos soldes.',
  },
  no_budgets: {
    icon: '📊',
    title: 'Aucun budget',
    description: 'Définissez des budgets par catégorie pour mieux contrôler vos dépenses.',
  },
  no_goals: {
    icon: '🎯',
    title: 'Aucun objectif',
    description: 'Créez un objectif d\'épargne pour rester motivé.',
  },
  search_no_results: {
    icon: '🔍',
    title: 'Aucun résultat',
    description: 'Essayez d\'autres critères ou mots-clés.',
  },
  no_templates: {
    icon: '📋',
    title: 'Aucun template',
    description: 'Créez un template depuis une transaction pour gagner du temps.',
  },
  no_wishlist: {
    icon: '⭐',
    title: 'Liste d\'envies vide',
    description: 'Ajoutez des articles que vous souhaitez acheter.',
  },
};

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({
  variant,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const config = VARIANTS[variant];
  const colors = theme.colors;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.title, { color: colors.text.primary }]}>{config.title}</Text>
      <Text style={[styles.description, { color: colors.text.secondary }]}>
        {config.description}
      </Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          variant="primary"
          onPress={onAction}
          style={styles.button}
        />
      )}
      {secondaryLabel && onSecondary && (
        <Button
          title={secondaryLabel}
          variant="ghost"
          onPress={onSecondary}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 32,
    alignItems: 'center',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  button: { marginTop: 8 },
});
