// ============================================
// ONYX - Settings Layout
// ============================================

import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="account-types" />
      <Stack.Screen name="quick-expenses" />
      <Stack.Screen name="data" />
      <Stack.Screen name="bank-import" />
      <Stack.Screen name="changelog" />
      <Stack.Screen name="security" />
    </Stack>
  );
}
