/**
 * PlayCompass - Smart Parenting Assistant
 *
 * Main application entry point
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { KidsProvider } from './src/context/KidsContext';
import { HistoryProvider } from './src/context/HistoryContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { SchedulerProvider } from './src/context/SchedulerContext';
import { ProgressProvider } from './src/context/ProgressContext';
import { PersonalizationProvider } from './src/context/PersonalizationContext';
import { FamilyProvider } from './src/context/FamilyContext';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import AppNavigator from './src/navigation/AppNavigator';
import { AchievementModal, OfflineIndicator } from './src/components/ui';
import { useProgress } from './src/context/ProgressContext';
import { Analytics, initializeCrashReporting, addBreadcrumb } from './src/services';
import { initializePurchases } from './src/services/purchaseService';
import OnboardingScreen, { isOnboardingComplete } from './src/screens/OnboardingScreen';

// Inner component to access theme for StatusBar
const AppContent = () => {
  const { isDark, colors } = useTheme();
  const { newAchievement, dismissAchievement } = useProgress();
  const [showOnboarding, setShowOnboarding] = useState(null); // null = loading, true = show, false = skip

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      const complete = await isOnboardingComplete();
      setShowOnboarding(!complete);
    };
    checkOnboarding();
  }, []);

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

  // Show loading while checking onboarding
  if (showOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary }}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineIndicator />
      <AppNavigator />
      <AchievementModal
        achievement={newAchievement}
        visible={!!newAchievement}
        onDismiss={dismissAchievement}
      />
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
                  <FavoritesProvider>
                    <SchedulerProvider>
                        <ProgressProvider>
                            <PersonalizationProvider>
                                <FamilyProvider>
                                    <AccessibilityProvider>
                                      <AppContent />
                                    </AccessibilityProvider>
                                  </FamilyProvider>
                              </PersonalizationProvider>
                          </ProgressProvider>
                      </SchedulerProvider>
                  </FavoritesProvider>
                </HistoryProvider>
              </KidsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
