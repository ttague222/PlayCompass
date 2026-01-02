/**
 * PlayCompass Cloud Functions Client
 *
 * Provides interface to call Cloud Functions for:
 * - User initialization
 * - Rate limiting
 * - Account management
 */

import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

// Get the functions instance
const functions = getFunctions();

/**
 * Initialize user document in Firestore
 * Called after user signs up or signs in for the first time
 */
export const initializeUserDoc = async () => {
  try {
    const initUser = httpsCallable(functions, 'initializeUserDoc');
    const result = await initUser();
    return result.data;
  } catch (error) {
    console.error('Error initializing user document:', error);
    // Don't throw - the app can work without this
    return { success: false, error: error.message };
  }
};

/**
 * Check rate limit for an action
 * @param {string} action - The action to check ('recommendations', 'activities', 'history')
 * @returns {Object} { allowed: boolean, remaining: number, retryAfter?: number }
 */
export const checkRateLimit = async (action) => {
  try {
    const checkLimit = httpsCallable(functions, 'checkRateLimit');
    const result = await checkLimit({ action });
    return result.data;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // If rate limit check fails, allow the action (fail open)
    return { allowed: true, remaining: -1 };
  }
};

/**
 * Request account deletion
 * Triggers cleanup of all user data
 */
export const requestAccountDeletion = async () => {
  try {
    // Note: The actual deletion is handled by Firebase Auth
    // The beforeUserDeleted trigger will clean up Firestore data
    const auth = require('@react-native-firebase/auth').default;
    const user = auth().currentUser;

    if (!user) {
      throw new Error('No user signed in');
    }

    // Delete the Firebase Auth account
    // This will trigger the beforeUserDeleted Cloud Function
    await user.delete();

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: error.message };
  }
};

export default {
  initializeUserDoc,
  checkRateLimit,
  requestAccountDeletion,
};
