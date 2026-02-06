// ============================================
// ONYX - Modal Component (Premium)
// Slide-up, backdrop blur, tailles, header/footer sticky
// ============================================

import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  /** Contenu principal (scrollable) */
  children: React.ReactNode;
  /** Footer sticky (boutons) */
  footer?: React.ReactNode;
  /** Swipe down to dismiss (gesture simple) */
  dismissOnBackdrop?: boolean;
  /** Pas de blur sur le backdrop (couleur unie) */
  noBlur?: boolean;
}

const sizeHeights: Record<ModalSize, number | string> = {
  sm: 0.35,
  md: 0.5,
  lg: 0.75,
  fullscreen: '100%',
};

export function Modal({
  visible,
  onClose,
  size = 'md',
  title,
  children,
  footer,
  dismissOnBackdrop = true,
  noBlur = false,
}: ModalProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { colors, radius } = theme;

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 280 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetHeight =
    typeof sizeHeights[size] === 'string'
      ? sizeHeights[size]
      : SCREEN_HEIGHT * (sizeHeights[size] as number);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackdropPress = () => {
    if (dismissOnBackdrop) onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.background.overlay,
              },
              backdropStyle,
            ]}
          />
          {!noBlur && (
            <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
              <BlurView
                intensity={40}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheetWrap} onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  height: sheetHeight,
                  backgroundColor: colors.background.secondary,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  paddingBottom: insets.bottom,
                },
                sheetStyle,
              ]}
            >
              {/* Handle bar */}
              <View style={styles.handleWrap}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: colors.text.tertiary },
                  ]}
                />
              </View>

              {title != null && title !== '' && (
                <View
                  style={[
                    styles.header,
                    {
                      paddingTop: insets.top + 8,
                      paddingHorizontal: 24,
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.background.tertiary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.title,
                      {
                        color: colors.text.primary,
                        fontSize: theme.typography.h3.size,
                        fontWeight: theme.typography.h3.weight,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                </View>
              )}

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingHorizontal: 24, paddingTop: 16, paddingBottom: footer ? 16 : 24 },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>

              {footer && (
                <View
                  style={[
                    styles.footer,
                    {
                      paddingHorizontal: 24,
                      paddingTop: 16,
                      paddingBottom: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.background.tertiary,
                    },
                  ]}
                >
                  {footer}
                </View>
              )}
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '100%',
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    width: '100%',
  },
  title: {
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    width: '100%',
  },
});
