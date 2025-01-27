// ============================================
// ONYX - PIN Dots Component
// Indicateurs visuels pour la saisie du PIN
// ============================================

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface PinDotsProps {
  length: 4 | 6;
  filled: number;
  error?: boolean;
  onErrorAnimationComplete?: () => void;
}

export function PinDots({ length, filled, error = false, onErrorAnimationComplete }: PinDotsProps) {
  const shake = useSharedValue(0);
  const errorOpacity = useSharedValue(0);

  useEffect(() => {
    if (error) {
      errorOpacity.value = 1;
      shake.value = withSequence(
        withTiming(-15, { duration: 50 }),
        withTiming(15, { duration: 50 }),
        withTiming(-15, { duration: 50 }),
        withTiming(15, { duration: 50 }),
        withTiming(0, { duration: 50 }, () => {
          if (onErrorAnimationComplete) {
            runOnJS(onErrorAnimationComplete)();
          }
        })
      );
      
      // Reset error state
      setTimeout(() => {
        errorOpacity.value = 0;
      }, 500);
    }
  }, [error]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <Animated.View 
      style={containerStyle} 
      className="flex-row items-center justify-center"
    >
      {Array.from({ length }).map((_, index) => (
        <PinDot
          key={index}
          filled={index < filled}
          error={error}
        />
      ))}
    </Animated.View>
  );
}

interface PinDotProps {
  filled: boolean;
  error: boolean;
}

function PinDot({ filled, error }: PinDotProps) {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue('rgba(255, 255, 255, 0.2)');

  useEffect(() => {
    if (filled) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      backgroundColor.value = withTiming(error ? '#EF4444' : '#6366F1', { duration: 150 });
    } else {
      scale.value = withSpring(1);
      backgroundColor.value = withTiming('rgba(255, 255, 255, 0.2)', { duration: 150 });
    }
  }, [filled, error]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: backgroundColor.value,
  }));

  return (
    <Animated.View
      style={[
        dotStyle,
        {
          width: 16,
          height: 16,
          borderRadius: 8,
          marginHorizontal: 8,
        },
      ]}
    />
  );
}
