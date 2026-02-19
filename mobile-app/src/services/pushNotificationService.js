/**
 * PlayCompass Push Notification Service
 *
 * Handles push notification registration, token management, and notification handling.
 * Uses Expo's push notification service which works with both FCM (Android) and APNs (iOS).
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Dynamically import to handle dev builds without native modules
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('[PushNotificationService] expo-notifications not available');
}

// Firestore for storing push tokens
let firestore = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
} catch (e) {
  console.warn('[PushNotificationService] Firestore not available');
}

/**
 * Check if push notifications are supported on this device
 */
export const isPushNotificationSupported = () => {
  return Notifications !== null && Device.isDevice;
};

/**
 * Get the Expo push token for this device
 * This token is used by Expo's push notification service
 */
export const getExpoPushToken = async () => {
  if (!Notifications) {
    return { success: false, error: 'Notifications not available' };
  }

  if (!Device.isDevice) {
    return { success: false, error: 'Push notifications only work on physical devices' };
  }

  try {
    // First check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { success: false, error: 'Permission not granted', status: finalStatus };
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      return { success: false, error: 'EAS project ID not configured' };
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return { success: true, token: tokenData.data };
  } catch (error) {
    console.error('[PushNotificationService] Error getting push token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Register the device's push token with Firestore
 * This allows the server to send push notifications to this device
 */
export const registerPushToken = async (userId) => {
  if (!firestore || !userId) {
    return { success: false, error: 'Firestore or userId not available' };
  }

  const tokenResult = await getExpoPushToken();

  if (!tokenResult.success) {
    return tokenResult;
  }

  try {
    const pushToken = tokenResult.token;
    const deviceId = Constants.installationId || `${Platform.OS}_${Date.now()}`;

    // Store token in user's push_tokens subcollection
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('push_tokens')
      .doc(deviceId)
      .set({
        token: pushToken,
        platform: Platform.OS,
        deviceName: Device.deviceName || 'Unknown',
        lastUpdated: firestore.FieldValue.serverTimestamp(),
        appVersion: Constants.expoConfig?.version || '1.0.0',
        isActive: true,
      }, { merge: true });

    console.log('[PushNotificationService] Push token registered successfully');
    return { success: true, token: pushToken };
  } catch (error) {
    console.error('[PushNotificationService] Error registering push token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unregister push token (e.g., on logout)
 */
export const unregisterPushToken = async (userId) => {
  if (!firestore || !userId) {
    return { success: false, error: 'Firestore or userId not available' };
  }

  try {
    const deviceId = Constants.installationId || `${Platform.OS}_${Date.now()}`;

    // Mark token as inactive instead of deleting (for analytics)
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('push_tokens')
      .doc(deviceId)
      .update({
        isActive: false,
        deactivatedAt: firestore.FieldValue.serverTimestamp(),
      });

    console.log('[PushNotificationService] Push token unregistered');
    return { success: true };
  } catch (error) {
    console.error('[PushNotificationService] Error unregistering push token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set up notification channels for Android
 */
export const setupNotificationChannels = async () => {
  if (!Notifications || Platform.OS !== 'android') {
    return;
  }

  try {
    // Activity reminders channel
    await Notifications.setNotificationChannelAsync('activity-reminders', {
      name: 'Activity Reminders',
      description: 'Reminders for scheduled activities',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7c3aed',
      sound: 'default',
    });

    // General updates channel
    await Notifications.setNotificationChannelAsync('general', {
      name: 'General Updates',
      description: 'App updates and announcements',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Tips and suggestions channel
    await Notifications.setNotificationChannelAsync('tips', {
      name: 'Tips & Suggestions',
      description: 'Activity suggestions and parenting tips',
      importance: Notifications.AndroidImportance.LOW,
    });

    console.log('[PushNotificationService] Notification channels configured');
  } catch (error) {
    console.error('[PushNotificationService] Error setting up channels:', error);
  }
};

/**
 * Handle notification received while app is foregrounded
 */
export const setNotificationHandler = () => {
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Customize based on notification type
      const data = notification.request.content.data;

      // Always show notification alerts
      return {
        shouldShowAlert: true,
        shouldPlaySound: data?.silent !== true,
        shouldSetBadge: false,
      };
    },
  });
};

/**
 * Add listener for notifications received while app is foregrounded
 */
export const addNotificationReceivedListener = (callback) => {
  if (!Notifications) return null;

  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add listener for notification interactions (user tapped notification)
 */
export const addNotificationResponseListener = (callback) => {
  if (!Notifications) return null;

  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get the last notification response (for handling app open from notification)
 */
export const getLastNotificationResponse = async () => {
  if (!Notifications) return null;

  return Notifications.getLastNotificationResponseAsync();
};

/**
 * Clear all delivered notifications
 */
export const clearAllNotifications = async () => {
  if (!Notifications) return;

  await Notifications.dismissAllNotificationsAsync();
};

/**
 * Get current notification permissions status
 */
export const getNotificationPermissions = async () => {
  if (!Notifications) {
    return { status: 'unavailable' };
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return { status };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  if (!Notifications) {
    return { granted: false, error: 'Notifications not available' };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return { granted: true, status: existingStatus };
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return { granted: status === 'granted', status };
  } catch (error) {
    return { granted: false, error: error.message };
  }
};

export default {
  isPushNotificationSupported,
  getExpoPushToken,
  registerPushToken,
  unregisterPushToken,
  setupNotificationChannels,
  setNotificationHandler,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  clearAllNotifications,
  getNotificationPermissions,
  requestNotificationPermissions,
};
