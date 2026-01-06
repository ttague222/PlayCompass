/**
 * PlayCompass TopBar Component
 *
 * Clean, minimalist top bar with logo only
 * Navigation moved to FAB menu for better UX
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const TopBar = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        {/* Logo / Brand */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary.main }]}>
            <Text style={styles.logoEmoji}>🧭</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text.primary }]}>PlayCompass</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoEmoji: {
    fontSize: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default TopBar;
