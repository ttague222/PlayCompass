/**
 * PlayCompass ScreenWrapper Component
 *
 * Provides consistent safe area handling across all devices:
 * - iPhone notch/Dynamic Island
 * - Android navigation bar (gesture/button)
 * - Tablets with different aspect ratios
 */

import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const ScreenWrapper = ({
  children,
  edges = ['top', 'left', 'right'], // Don't include bottom by default for screens with bottom bars
  withGradient = true,
  style,
  contentStyle,
  bottomBarHeight = 0, // Height of bottom bar if present
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Detect if device is a tablet (width > 600dp is typically tablet)
  const isTablet = width >= 600;

  // Calculate max content width for tablets to prevent overly wide layouts
  const maxContentWidth = isTablet ? 600 : width;

  // Calculate bottom padding that accounts for:
  // 1. Safe area inset (for devices with gesture navigation)
  // 2. Any bottom bar height passed in
  const bottomPadding = Math.max(insets.bottom, 0) + bottomBarHeight;

  const gradientColors = isDark
    ? ['#0f0f1a', '#1a1a2e', '#252540']
    : ['#f8fafc', '#e2e8f0', '#cbd5e1'];

  const content = (
    <SafeAreaView
      edges={edges}
      style={[
        styles.safeArea,
        { paddingBottom: edges.includes('bottom') ? 0 : bottomPadding },
        style,
      ]}
    >
      <View
        style={[
          styles.content,
          isTablet && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );

  if (withGradient) {
    return (
      <LinearGradient colors={gradientColors} style={styles.container}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenWrapper;
