/**
 * PlayCompass Accessibility Context
 *
 * Global state for accessibility settings
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAccessibilitySettings,
  saveAccessibilitySettings,
  subscribeToAccessibilityChanges,
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  FONT_SIZES,
  getColorBlindColors,
} from '../utils/accessibility';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderEnabled: false,
    hapticFeedback: true,
    fontSize: 'normal',
    colorBlindMode: 'none',
  });
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getAccessibilitySettings();
      setSettings(savedSettings);
      setLoading(false);
    };
    loadSettings();
  }, []);

  // Subscribe to system accessibility changes
  useEffect(() => {
    const unsubscribe = subscribeToAccessibilityChanges({
      onScreenReaderChange: (enabled) => {
        setSettings((prev) => ({ ...prev, screenReaderEnabled: enabled }));
      },
      onReduceMotionChange: (enabled) => {
        setSettings((prev) => ({ ...prev, reduceMotion: enabled }));
      },
    });

    return unsubscribe;
  }, []);

  // Update a single setting
  const updateSetting = useCallback(async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveAccessibilitySettings(newSettings);
  }, [settings]);

  // Get font scale based on settings
  const getFontScale = useCallback(() => {
    return FONT_SIZES[settings.fontSize] || FONT_SIZES.normal;
  }, [settings.fontSize]);

  // Get scaled font size
  const getScaledFontSize = useCallback((baseSize) => {
    return Math.round(baseSize * getFontScale());
  }, [getFontScale]);

  // Get colors adjusted for color blindness
  const getAdjustedColors = useCallback(() => {
    return getColorBlindColors(settings.colorBlindMode);
  }, [settings.colorBlindMode]);

  // Check if animations should be reduced
  const shouldReduceMotion = useCallback(() => {
    return settings.reduceMotion;
  }, [settings.reduceMotion]);

  // Check if high contrast mode is enabled
  const isHighContrast = useCallback(() => {
    return settings.highContrast;
  }, [settings.highContrast]);

  // Get animation duration (0 if reduce motion)
  const getAnimationDuration = useCallback((duration) => {
    return settings.reduceMotion ? 0 : duration;
  }, [settings.reduceMotion]);

  const value = {
    settings,
    loading,
    updateSetting,
    getFontScale,
    getScaledFontSize,
    getAdjustedColors,
    shouldReduceMotion,
    isHighContrast,
    getAnimationDuration,
    isScreenReaderActive: settings.screenReaderEnabled,
    hapticEnabled: settings.hapticFeedback,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext;
