// ============================================
// ONYX - useTheme Hook
// Retourne le thème actif (dark/light) selon préférence ou système
// ============================================

import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores';
import { getTheme, type Theme, type ThemeMode } from '@/constants/theme';

export function useTheme(): { theme: Theme; mode: ThemeMode; isDark: boolean } {
  const preferredTheme = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();
  const mode: ThemeMode =
    preferredTheme === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : preferredTheme;
  const theme = getTheme(mode);
  return { theme, mode, isDark: mode === 'dark' };
}
