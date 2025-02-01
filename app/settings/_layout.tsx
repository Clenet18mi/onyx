// ============================================
// ONYX - Settings Layout
// ============================================

import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0B' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="account-types" />
      <Stack.Screen name="quick-expenses" />
    </Stack>
  );
}
