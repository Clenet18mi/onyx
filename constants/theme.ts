// ============================================
// ONYX - Design System Theme
// Palette premium, ombres, rayons, typographie
// ============================================

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
  };
  accent: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  gradients: {
    card: [string, string];
    primary: [string, string];
    success: [string, string];
    danger: [string, string];
    premium: [string, string, string];
  };
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  colored: string;
}

export interface ThemeRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface TypographyStyle {
  size: number;
  weight: '400' | '500' | '600' | '700';
  lineHeight: number;
}

export interface ThemeTypography {
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  h4: TypographyStyle;
  body: TypographyStyle;
  bodyMedium: TypographyStyle;
  bodySemiBold: TypographyStyle;
  small: TypographyStyle;
  tiny: TypographyStyle;
  caption: TypographyStyle;
}

export interface Theme {
  colors: ThemeColors;
  shadows: ThemeShadows;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
}

const darkColors: ThemeColors = {
  background: {
    primary: '#0B0D12',
    secondary: '#131722',
    tertiary: '#1B2030',
    card: 'rgba(16, 20, 31, 0.96)',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    primary: '#F4F7FB',
    secondary: '#9AA4B2',
    tertiary: '#5C6B80',
    disabled: '#4A5568',
  },
  accent: {
    primary: '#6D7CFF',
    secondary: '#4FD1C5',
    success: '#2DD4A1',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#60A5FA',
  },
  gradients: {
    card: ['#171B26', '#131722'],
    primary: ['#6D7CFF', '#7C6BFF'],
    success: ['#2DD4A1', '#10B981'],
    danger: ['#F87171', '#EF4444'],
    premium: ['#6D7CFF', '#4FD1C5', '#2DD4A1'],
  },
};

const lightColors: ThemeColors = {
  background: {
    primary: '#F7F8FC',
    secondary: '#FFFFFF',
    tertiary: '#E8ECF5',
    card: 'rgba(255, 255, 255, 0.98)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#101828',
    secondary: '#667085',
    tertiary: '#98A2B3',
    disabled: '#D0D5DD',
  },
  accent: {
    primary: '#5B6CFF',
    secondary: '#14B8A6',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  gradients: {
    card: ['#FFFFFF', '#F2F5FB'],
    primary: ['#5B6CFF', '#6D7CFF'],
    success: ['#16A34A', '#10B981'],
    danger: ['#EF4444', '#F87171'],
    premium: ['#5B6CFF', '#14B8A6', '#2DD4A1'],
  },
};

const shadows: ThemeShadows = {
  sm: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  md: '0px 4px 16px rgba(0, 0, 0, 0.12)',
  lg: '0px 8px 32px rgba(0, 0, 0, 0.16)',
  xl: '0px 16px 48px rgba(0, 0, 0, 0.2)',
  colored: '0px 8px 32px rgba(99, 102, 241, 0.3)',
};

const radius: ThemeRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography: ThemeTypography = {
  h1: { size: 32, weight: '700', lineHeight: 40 },
  h2: { size: 24, weight: '600', lineHeight: 32 },
  h3: { size: 20, weight: '600', lineHeight: 28 },
  h4: { size: 18, weight: '600', lineHeight: 24 },
  body: { size: 16, weight: '400', lineHeight: 24 },
  bodyMedium: { size: 16, weight: '500', lineHeight: 24 },
  bodySemiBold: { size: 16, weight: '600', lineHeight: 24 },
  small: { size: 14, weight: '400', lineHeight: 20 },
  tiny: { size: 12, weight: '400', lineHeight: 16 },
  caption: { size: 11, weight: '500', lineHeight: 14 },
};

/** Thème complet (couleurs + tokens) pour un mode donné */
export function getTheme(mode: ThemeMode): Theme {
  const safeMode: ThemeMode = mode === 'dark' || mode === 'light' ? mode : 'dark';
  return {
    colors: safeMode === 'dark' ? darkColors : lightColors,
    shadows,
    radius,
    spacing,
    typography,
  };
}

/** Objet theme brut pour les deux modes (usage statique) */
export const theme = {
  dark: getTheme('dark'),
  light: getTheme('light'),
  shadows,
  radius,
  spacing,
  typography,
} as const;
