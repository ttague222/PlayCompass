/**
 * PlayCompass App Navigator
 *
 * Main navigation structure for the app
 * Uses Home Hub pattern - single main screen with overflow menu for secondary items
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AuthScreen from '../screens/AuthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import KidsListScreen from '../screens/KidsListScreen';
import AddKidScreen from '../screens/AddKidScreen';
import TimeSelectScreen from '../screens/TimeSelectScreen';
import RecommendationScreen from '../screens/RecommendationScreen';
import AcceptedActivitiesScreen from '../screens/AcceptedActivitiesScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import SavedActivitiesScreen from '../screens/SavedActivitiesScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ProgressScreen from '../screens/ProgressScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import FamilyScreen from '../screens/FamilyScreen';
import AccessibilityScreen from '../screens/AccessibilityScreen';
import CustomActivitiesScreen from '../screens/CustomActivitiesScreen';

const Stack = createNativeStackNavigator();

// Loading screen component
const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary
    }}>
      <Text style={{ fontSize: 64, marginBottom: 24 }}>🧭</Text>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={{ color: colors.text.secondary, marginTop: 16 }}>Loading...</Text>
    </View>
  );
};

// Main stack - Home Hub pattern (no tabs)
const MainStack = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      {/* Home is the hub - main entry point */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* Secondary screens accessible via overflow menu */}
      <Stack.Screen
        name="KidsList"
        component={KidsListScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AddKid"
        component={AddKidScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="SavedActivities"
        component={SavedActivitiesScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Family"
        component={FamilyScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Accessibility"
        component={AccessibilityScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CustomActivities"
        component={CustomActivitiesScreen}
        options={{ animation: 'slide_from_right' }}
      />

      {/* Recommendation flow */}
      <Stack.Screen
        name="TimeSelect"
        component={TimeSelectScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Recommendation"
        component={RecommendationScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AcceptedActivities"
        component={AcceptedActivitiesScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

// Root navigator
const AppNavigator = () => {
  const { isAuthenticated, initializing } = useAuth();
  const { colors } = useTheme();

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'fade',
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
