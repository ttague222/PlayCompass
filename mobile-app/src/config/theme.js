/**
 * PlayCompass Theme Configuration
 *
 * Warm. Supportive. Calm. Trustworthy.
 * Designed for busy parents making quick decisions.
 */

export const colors = {
  // Primary palette - Sage Green (Brand Core)
  primary: {
    main: '#4C837A',      // Primary Sage Green
    light: '#6B9B93',     // Lighter sage
    dark: '#2E6F59',      // Deep Forest Accent
    contrast: '#ffffff',
  },

  // Secondary palette - Peach Warm Accent
  secondary: {
    main: '#FFB38A',      // Peach Warm Accent
    light: '#FFCBA8',     // Lighter peach
    dark: '#FF9E7A',      // Soft Coral Variant
    contrast: '#2B2B2B',
  },

  // Success/positive actions - Soft Green
  success: {
    main: '#7FC8A9',
    light: '#9FD8BF',
    dark: '#5FB889',
  },

  // Warning states - Warm Amber
  warning: {
    main: '#F4B400',
    light: '#F7C94D',
    dark: '#D9A000',
  },

  // Info states - Soft Blue
  info: {
    main: '#82B1FF',
    light: '#A8C9FF',
    dark: '#5C99FF',
  },

  // Error states - kept subtle, no harsh reds
  error: {
    main: '#E57373',      // Softer red
    light: '#EF9A9A',
    dark: '#D32F2F',
  },

  // Neutral palette - warm tones
  neutral: {
    50: '#FFFDF8',        // Warm cream (main background)
    100: '#F3EFE9',       // Inactive chip background
    200: '#EDE7E1',       // Secondary background
    300: '#D4CFC9',
    400: '#B9B9B9',       // Disabled
    500: '#6B6B6B',       // Muted text
    600: '#4A4A4A',       // Body text
    700: '#2B2B2B',       // Primary headline
    800: '#1F1F1F',
    900: '#121212',
  },
};

export const lightTheme = {
  mode: 'light',
  colors: {
    ...colors,
    background: {
      primary: '#FFFDF8',     // Warm cream (main app background)
      secondary: '#EDE7E1',   // Secondary background
      tertiary: '#F3EFE9',    // Inactive surfaces
    },
    surface: {
      primary: '#FFFFFF',     // Cards / Surfaces
      secondary: '#FFFDF8',   // Warm cream
      elevated: '#FFFFFF',    // Elevated cards
    },
    text: {
      primary: '#2B2B2B',     // Primary headline
      secondary: '#4A4A4A',   // Body text
      tertiary: '#6B6B6B',    // Muted text / Helpers
      disabled: '#B9B9B9',    // Disabled
      inverse: '#ffffff',
    },
    border: {
      light: '#EDE7E1',
      medium: '#D4CFC9',
      dark: '#B9B9B9',
    },
  },
  gradients: {
    primary: ['#4C837A', '#2E6F59'],     // Sage to deep forest
    secondary: ['#FFB38A', '#FF9E7A'],   // Peach gradient
    warm: ['#FFFDF8', '#EDE7E1'],        // Warm cream
    cool: ['#E8F5E9', '#C8E6C9'],        // Soft green
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    ...colors,
    background: {
      primary: '#1A1F1E',     // Dark sage-tinted background
      secondary: '#252A29',   // Secondary dark
      tertiary: '#2F3534',    // Tertiary dark
    },
    surface: {
      primary: '#252A29',     // Card surfaces
      secondary: '#2F3534',   // Secondary surfaces
      elevated: '#3A403F',    // Elevated cards
    },
    text: {
      primary: '#F5F5F5',     // Primary text in dark mode
      secondary: '#B0B8B6',   // Secondary text
      tertiary: '#7A8583',    // Muted text
      disabled: '#5A6260',    // Disabled
      inverse: '#2B2B2B',
    },
    border: {
      light: '#3A403F',
      medium: '#4A5250',
      dark: '#5A6260',
    },
  },
  gradients: {
    primary: ['#4C837A', '#2E6F59'],     // Sage gradient (same as light)
    secondary: ['#FFB38A', '#FF9E7A'],   // Peach gradient
    warm: ['#252A29', '#2F3534'],        // Dark warm
    cool: ['#1E2D2A', '#253530'],        // Dark sage-tinted
  },
};

export const typography = {
  // Font families (using system fonts)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 14,        // Primary button radius
  xl: 18,        // Card radius
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

export default {
  light: lightTheme,
  dark: darkTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
};
