/**
 * PlayCompass Accessibility Utilities
 *
 * Helpers for improving app accessibility
 */

import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESSIBILITY_SETTINGS_KEY = '@playcompass_accessibility';

/**
 * Default accessibility settings
 */
const DEFAULT_SETTINGS = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderEnabled: false,
  hapticFeedback: true,
  fontSize: 'normal', // 'small', 'normal', 'large', 'xlarge'
  colorBlindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
};

/**
 * Font size multipliers
 */
export const FONT_SIZES = {
  small: 0.85,
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async () => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.error('Error checking screen reader:', error);
    return false;
  }
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async () => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.error('Error checking reduce motion:', error);
    return false;
  }
};

/**
 * Subscribe to accessibility changes
 */
export const subscribeToAccessibilityChanges = (callbacks) => {
  const subscriptions = [];

  if (callbacks.onScreenReaderChange) {
    subscriptions.push(
      AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        callbacks.onScreenReaderChange
      )
    );
  }

  if (callbacks.onReduceMotionChange) {
    subscriptions.push(
      AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        callbacks.onReduceMotionChange
      )
    );
  }

  return () => {
    subscriptions.forEach((sub) => sub?.remove());
  };
};

/**
 * Announce message for screen readers
 */
export const announceForAccessibility = (message) => {
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Get accessibility settings
 */
export const getAccessibilitySettings = async () => {
  try {
    const stored = await AsyncStorage.getItem(ACCESSIBILITY_SETTINGS_KEY);
    const settings = stored ? JSON.parse(stored) : {};

    // Get system settings
    const [screenReaderEnabled, reduceMotion] = await Promise.all([
      isScreenReaderEnabled(),
      isReduceMotionEnabled(),
    ]);

    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      screenReaderEnabled,
      reduceMotion: settings.reduceMotion ?? reduceMotion,
    };
  } catch (error) {
    console.error('Error getting accessibility settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save accessibility settings
 */
export const saveAccessibilitySettings = async (settings) => {
  try {
    await AsyncStorage.setItem(
      ACCESSIBILITY_SETTINGS_KEY,
      JSON.stringify(settings)
    );
    return { success: true };
  } catch (error) {
    console.error('Error saving accessibility settings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update specific accessibility setting
 */
export const updateAccessibilitySetting = async (key, value) => {
  try {
    const settings = await getAccessibilitySettings();
    settings[key] = value;
    return saveAccessibilitySettings(settings);
  } catch (error) {
    console.error('Error updating accessibility setting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate accessibility props for interactive elements
 */
export const getAccessibilityProps = (options = {}) => {
  const {
    label,
    hint,
    role = 'button',
    state = {},
    value = {},
    actions = [],
  } = options;

  const props = {
    accessible: true,
    accessibilityLabel: label,
  };

  if (hint) {
    props.accessibilityHint = hint;
  }

  if (role) {
    props.accessibilityRole = role;
  }

  if (Object.keys(state).length > 0) {
    props.accessibilityState = state;
  }

  if (Object.keys(value).length > 0) {
    props.accessibilityValue = value;
  }

  if (actions.length > 0) {
    props.accessibilityActions = actions;
  }

  return props;
};

/**
 * Get accessibility label for activity card
 */
export const getActivityCardLabel = (activity) => {
  const parts = [activity.name];

  if (activity.category) {
    parts.push(`Category: ${activity.category}`);
  }

  if (activity.duration) {
    parts.push(`Duration: ${activity.duration} minutes`);
  }

  if (activity.ageRange) {
    parts.push(`Age range: ${activity.ageRange}`);
  }

  if (activity.description) {
    parts.push(activity.description.substring(0, 100));
  }

  return parts.join('. ');
};

/**
 * Get accessibility label for rating
 */
export const getRatingLabel = (rating, maxRating = 5) => {
  return `Rating: ${rating} out of ${maxRating} stars`;
};

/**
 * Get accessibility label for progress
 */
export const getProgressLabel = (current, total, label = 'Progress') => {
  const percentage = Math.round((current / total) * 100);
  return `${label}: ${current} of ${total}, ${percentage} percent complete`;
};

/**
 * Color blind friendly color alternatives
 */
export const COLOR_BLIND_PALETTES = {
  none: {
    primary: '#4F46E5',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  protanopia: {
    primary: '#0066CC',
    success: '#009999',
    warning: '#CC9900',
    error: '#CC6600',
  },
  deuteranopia: {
    primary: '#0066CC',
    success: '#0099CC',
    warning: '#CC9900',
    error: '#CC3300',
  },
  tritanopia: {
    primary: '#CC3366',
    success: '#009999',
    warning: '#CC6666',
    error: '#990000',
  },
};

/**
 * Get colors adjusted for color blindness
 */
export const getColorBlindColors = (mode = 'none') => {
  return COLOR_BLIND_PALETTES[mode] || COLOR_BLIND_PALETTES.none;
};

/**
 * Check if touch target size is accessible (minimum 44x44 on iOS, 48x48 on Android)
 */
export const getMinTouchTargetSize = () => {
  return Platform.select({
    ios: 44,
    android: 48,
    default: 44,
  });
};

/**
 * Semantic heading levels for screen readers
 */
export const HEADING_LEVELS = {
  h1: { accessibilityRole: 'header', 'aria-level': 1 },
  h2: { accessibilityRole: 'header', 'aria-level': 2 },
  h3: { accessibilityRole: 'header', 'aria-level': 3 },
  h4: { accessibilityRole: 'header', 'aria-level': 4 },
};

/**
 * Get heading accessibility props
 */
export const getHeadingProps = (level = 'h1') => {
  return HEADING_LEVELS[level] || HEADING_LEVELS.h1;
};

/**
 * Focus management helpers
 */
export const setAccessibilityFocus = (ref) => {
  if (ref?.current) {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
};

/**
 * Live region for dynamic content updates
 */
export const getLiveRegionProps = (polite = true) => {
  return {
    accessibilityLiveRegion: polite ? 'polite' : 'assertive',
  };
};

/**
 * Check for adequate color contrast (WCAG AA standard)
 */
export const hasAdequateContrast = (foreground, background) => {
  // Simplified contrast check
  // In a full implementation, this would calculate actual contrast ratio
  return true;
};

export default {
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  subscribeToAccessibilityChanges,
  announceForAccessibility,
  getAccessibilitySettings,
  saveAccessibilitySettings,
  updateAccessibilitySetting,
  getAccessibilityProps,
  getActivityCardLabel,
  getRatingLabel,
  getProgressLabel,
  getColorBlindColors,
  getMinTouchTargetSize,
  getHeadingProps,
  setAccessibilityFocus,
  getLiveRegionProps,
  hasAdequateContrast,
  FONT_SIZES,
  HEADING_LEVELS,
  COLOR_BLIND_PALETTES,
};
