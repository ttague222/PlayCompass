/**
 * PlayCompass Theme Context
 *
 * Provides theme (light/dark mode) throughout the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, typography, spacing, borderRadius, shadows } from '../config/theme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemColorScheme || 'light');

  // Follow system preference by default
  useEffect(() => {
    if (systemColorScheme) {
      setThemeMode(systemColorScheme);
    }
  }, [systemColorScheme]);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setLight = () => setThemeMode('light');
  const setDark = () => setThemeMode('dark');
  const setSystem = () => setThemeMode(systemColorScheme || 'light');

  const value = {
    theme,
    themeMode,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light',
    toggleTheme,
    setLight,
    setDark,
    setSystem,
    // Convenience exports
    colors: theme.colors,
    gradients: theme.gradients,
    typography,
    spacing,
    borderRadius,
    shadows,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
