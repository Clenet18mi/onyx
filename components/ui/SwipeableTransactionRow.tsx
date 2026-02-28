// ============================================
// ONYX - Swipeable row with delete action
// Swipe left to reveal "Supprimer", tap = contextual alert
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { Animated } from 'react-native';

const DELETE_WIDTH = 88;

interface SwipeableTransactionRowProps {
  children: React.ReactNode;
  onPress: () => void;
  onDelete: () => void;
  deleteLabel: string;
  hapticEnabled?: boolean;
}

export function SwipeableTransactionRow({
  children,
  onPress,
  onDelete,
  deleteLabel,
  hapticEnabled = true,
}: SwipeableTransactionRowProps) {
  const swipeableRef = React.useRef<Swipeable>(null);

  const handleDeletePress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    swipeableRef.current?.close();
    Alert.alert(
      'Supprimer',
      deleteLabel,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => (
    <View style={styles.rightActions}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeletePress}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={DELETE_WIDTH * 0.5}
      friction={1.5}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
        {children}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'transparent',
  },
  rightActions: {
    width: DELETE_WIDTH,
    backgroundColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
