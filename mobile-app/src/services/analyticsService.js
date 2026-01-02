/**
 * PlayCompass Analytics Service
 *
 * Tracks user events and app usage for insights
 */

import * as Application from 'expo-application';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = '@playcompass_analytics';
const SESSION_KEY = '@playcompass_session';

// Check if analytics is enabled
const isEnabled = () => {
  return Constants.expoConfig?.extra?.enableAnalytics !== false;
};

// Get or create session ID
const getSessionId = async () => {
  try {
    let sessionId = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `session_${Date.now()}`;
  }
};

// Get device info
const getDeviceInfo = () => {
  return {
    appVersion: Application.nativeApplicationVersion || 'dev',
    buildVersion: Application.nativeBuildVersion || 'dev',
    platform: Constants.platform?.os || 'unknown',
    expoVersion: Constants.expoVersion || 'unknown',
  };
};

// Store event locally
const storeEvent = async (event) => {
  if (!isEnabled()) return;

  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
    const events = stored ? JSON.parse(stored) : [];

    // Keep last 500 events max
    if (events.length >= 500) {
      events.shift();
    }

    events.push(event);
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to store analytics event:', error);
  }
};

/**
 * Track a custom event
 */
export const trackEvent = async (eventName, properties = {}) => {
  if (!isEnabled()) return;

  const sessionId = await getSessionId();
  const deviceInfo = getDeviceInfo();

  const event = {
    name: eventName,
    properties,
    timestamp: new Date().toISOString(),
    sessionId,
    device: deviceInfo,
  };

  await storeEvent(event);

  // Log in development
  if (__DEV__) {
    console.log('[Analytics]', eventName, properties);
  }
};

/**
 * Track screen view
 */
export const trackScreen = async (screenName, params = {}) => {
  await trackEvent('screen_view', {
    screen_name: screenName,
    ...params,
  });
};

/**
 * Track user action
 */
export const trackAction = async (action, category, label = null, value = null) => {
  await trackEvent('user_action', {
    action,
    category,
    label,
    value,
  });
};

// Pre-defined event trackers
export const Analytics = {
  // Auth events
  signIn: (method) => trackEvent('sign_in', { method }),
  signOut: () => trackEvent('sign_out'),
  signUp: (method) => trackEvent('sign_up', { method }),

  // Kid profile events
  addKid: (ageGroup) => trackEvent('add_kid', { age_group: ageGroup }),
  removeKid: () => trackEvent('remove_kid'),
  updateKid: () => trackEvent('update_kid'),

  // Recommendation events
  startSession: (duration, kidCount) =>
    trackEvent('recommendation_session_start', { duration, kid_count: kidCount }),
  completeSession: (totalActivities, likedCount, duration) =>
    trackEvent('recommendation_session_complete', {
      total_activities: totalActivities,
      liked_count: likedCount,
      duration,
      like_rate: totalActivities > 0 ? (likedCount / totalActivities).toFixed(2) : 0,
    }),
  likeActivity: (activityId, activityTitle, category) =>
    trackEvent('activity_liked', { activity_id: activityId, title: activityTitle, category }),
  skipActivity: (activityId, activityTitle, category) =>
    trackEvent('activity_skipped', { activity_id: activityId, title: activityTitle, category }),

  // Navigation events
  viewScreen: (screenName) => trackScreen(screenName),
  tapButton: (buttonName, screen) =>
    trackAction('tap', 'button', buttonName, screen),

  // App lifecycle
  appOpen: () => trackEvent('app_open'),
  appBackground: () => trackEvent('app_background'),
  appForeground: () => trackEvent('app_foreground'),

  // Errors
  error: (errorType, message, screen = null) =>
    trackEvent('error', { type: errorType, message, screen }),

  // Feature usage
  useFilter: (filterType, value) =>
    trackEvent('filter_used', { filter_type: filterType, value }),
  viewHistory: () => trackEvent('view_history'),
  viewActivityDetail: (activityId) =>
    trackEvent('view_activity_detail', { activity_id: activityId }),
};

/**
 * Get stored analytics for debugging/export
 */
export const getStoredAnalytics = async () => {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Clear stored analytics
 */
export const clearAnalytics = async () => {
  try {
    await AsyncStorage.removeItem(ANALYTICS_KEY);
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear analytics:', error);
  }
};

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = async () => {
  const events = await getStoredAnalytics();

  const summary = {
    totalEvents: events.length,
    eventCounts: {},
    firstEvent: events[0]?.timestamp,
    lastEvent: events[events.length - 1]?.timestamp,
  };

  events.forEach((event) => {
    summary.eventCounts[event.name] = (summary.eventCounts[event.name] || 0) + 1;
  });

  return summary;
};

export default Analytics;
