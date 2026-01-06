/**
 * PlayCompass Offline Indicator
 *
 * Displays a banner when the device is offline
 * Subscribes to network status changes from offlineService
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { isOnline, subscribeToNetworkStatus } from '../../services/offlineService';

const OfflineIndicator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-60));

  useEffect(() => {
    // Check initial status
    const checkInitialStatus = async () => {
      const online = await isOnline();
      setOffline(!online);
    };
    checkInitialStatus();

    // Subscribe to network changes
    const unsubscribe = subscribeToNetworkStatus((state) => {
      const isOffline = !state.isConnected || state.isInternetReachable === false;
      setOffline(isOffline);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Animate banner in/out
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: offline ? 0 : -60,
      useNativeDriver: true,
      tension: 100,
      friction: 15,
    }).start();
  }, [offline, slideAnim]);

  // Don't render if online (but keep mounted for animation)
  if (!offline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.warning.main,
          paddingTop: insets.top > 0 ? insets.top : 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <Text style={[styles.text, { color: '#fff' }]}>
          You're offline. Some features may be limited.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OfflineIndicator;
