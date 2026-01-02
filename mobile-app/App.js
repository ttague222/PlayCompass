/**
 * PlayCompass - Smart Parenting Assistant
 *
 * Main application entry point
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { KidsProvider } from './src/context/KidsContext';
import { HistoryProvider } from './src/context/HistoryContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Analytics, initializeCrashReporting, addBreadcrumb } from './src/services';
import { initializePurchases } from './src/services/purchaseService';

// Inner component to access theme for StatusBar
const AppContent = () => {
  const { isDark } = useTheme();

  // Track app lifecycle
  useEffect(() => {
    Analytics.appOpen();
    addBreadcrumb('App opened', 'lifecycle');

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        Analytics.appForeground();
        addBreadcrumb('App came to foreground', 'lifecycle');
      } else if (nextAppState === 'background') {
        Analytics.appBackground();
        addBreadcrumb('App went to background', 'lifecycle');
      }
    });

    return () => subscription?.remove();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

// Initialize crash reporting on module load
initializeCrashReporting();

// Initialize RevenueCat purchases
initializePurchases().catch((error) => {
  console.error('[App] Failed to initialize purchases:', error);
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <KidsProvider>
                <HistoryProvider>
                  <AppContent />
                </HistoryProvider>
              </KidsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
