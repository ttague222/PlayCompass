/**
 * PlayCompass - Smart Parenting Assistant
 *
 * Main application entry point
 */

import React, { useEffect, useState, Component } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
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
import {
  setNotificationHandler,
  setupNotificationChannels,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
} from './src/services/pushNotificationService';
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

  // Set up push notification listeners
  useEffect(() => {
    // Handle notifications received while app is foregrounded
    const notificationListener = addNotificationReceivedListener((notification) => {
      console.log('[App] Notification received:', notification.request.content.title);
      addBreadcrumb('Notification received', 'notification', {
        title: notification.request.content.title,
      });
    });

    // Handle notification interactions (user tapped notification)
    const responseListener = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[App] Notification tapped:', data);
      addBreadcrumb('Notification tapped', 'notification', { type: data?.type });

      // Handle navigation based on notification type
      // This will be handled by navigation once we have a ref
      if (data?.type === 'activity_reminder' && data?.activityId) {
        // Navigate to activity detail - handled by deep linking
        console.log('[App] Should navigate to activity:', data.activityId);
      }
    });

    // Check if app was opened from a notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        console.log('[App] App opened from notification:', response.notification.request.content.data);
      }
    });

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
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

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '463549869998-ar1h089r9hp4f0p87lrbta7fne7regl6.apps.googleusercontent.com',
});

// Initialize RevenueCat purchases
initializePurchases().catch((error) => {
  console.error('[App] Failed to initialize purchases:', error);
});

// Set up push notification handler (must be called at module level)
setNotificationHandler();

// Set up Android notification channels
setupNotificationChannels();

// Error Boundary to catch uncaught JavaScript errors and prevent bridge crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    // Log to crash reporting service
    addBreadcrumb('ErrorBoundary caught error', 'error', {
      error: error?.message,
      componentStack: errorInfo?.componentStack?.substring(0, 500),
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>😕</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            The app encountered an unexpected error. Please try again.
          </Text>
          <TouchableOpacity style={errorStyles.button} onPress={this.handleRetry}>
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4A90A4',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
