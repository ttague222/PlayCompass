/**
 * PlayCompass Auth Service
 *
 * Handles Firebase Authentication operations:
 * - Anonymous sign-in (for quick start)
 * - Google Sign-In (for account linking)
 * - User profile management in Firestore
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Collection reference
const usersCollection = firestore().collection('users');

/**
 * Sign in anonymously - for quick start without account
 */
export const signInAnonymously = async () => {
  try {
    const userCredential = await auth().signInAnonymously();
    await createOrUpdateUserProfile(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get the user's ID token
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult?.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token found');
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Check if user is currently anonymous
    const currentUser = auth().currentUser;
    let userCredential;

    if (currentUser?.isAnonymous) {
      // Link anonymous account with Google
      try {
        userCredential = await currentUser.linkWithCredential(googleCredential);
      } catch (linkError) {
        // If linking fails (account already exists), sign in directly
        if (linkError.code === 'auth/credential-already-in-use') {
          userCredential = await auth().signInWithCredential(googleCredential);
        } else {
          throw linkError;
        }
      }
    } else {
      // Direct sign in with Google
      userCredential = await auth().signInWithCredential(googleCredential);
    }

    await createOrUpdateUserProfile(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    // Sign out from Google if signed in
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore if not signed in with Google
    }

    await auth().signOut();
    return { success: true };
  } catch (error) {
    console.error('Sign-out error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update user profile in Firestore
 */
export const createOrUpdateUserProfile = async (user) => {
  if (!user) return null;

  const userRef = usersCollection.doc(user.uid);

  const userData = {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    isAnonymous: user.isAnonymous,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  try {
    const userDoc = await userRef.get();

    if (!userDoc.exists()) {
      // Create new user profile
      await userRef.set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        // Start trial immediately for new users
        trialStartDate: firestore.FieldValue.serverTimestamp(),
        // Default preferences
        preferences: {
          notifications: true,
          darkMode: 'system',
        },
        // Kids array will be added in Task 3
        kids: [],
        // Subscription info for Task 11
        subscription: {
          tier: 'free',
          dailyRecsUsed: 0,
          lastRecDate: null,
        },
      });
    } else {
      // Update existing profile
      await userRef.update(userData);
    }
  } catch (error) {
    // If document not found, create it
    if (error.code === 'firestore/not-found' || error.code === 'not-found') {
      await userRef.set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        // Start trial immediately for new users
        trialStartDate: firestore.FieldValue.serverTimestamp(),
        preferences: {
          notifications: true,
          darkMode: 'system',
        },
        kids: [],
        subscription: {
          tier: 'free',
          dailyRecsUsed: 0,
          lastRecDate: null,
        },
      });
    } else {
      throw error;
    }
  }

  return userRef;
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await usersCollection.doc(uid).get();
    if (userDoc.exists()) {
      return { success: true, profile: userDoc.data() };
    }
    return { success: false, error: 'User profile not found' };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (uid, preferences) => {
  try {
    await usersCollection.doc(uid).update({
      preferences,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Update preferences error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    await createOrUpdateUserProfile(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Email sign-in error:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email, password) => {
  try {
    // Check if user is currently anonymous
    const currentUser = auth().currentUser;
    let userCredential;

    if (currentUser?.isAnonymous) {
      // Link anonymous account with email/password
      const credential = auth.EmailAuthProvider.credential(email, password);
      try {
        userCredential = await currentUser.linkWithCredential(credential);
      } catch (linkError) {
        // Re-throw all linking errors (including email-already-in-use)
        throw linkError;
      }
    } else {
      // Create new account with email/password
      userCredential = await auth().createUserWithEmailAndPassword(email, password);
    }

    await createOrUpdateUserProfile(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Email sign-up error:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await auth().sendPasswordResetEmail(email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Delete user account and all associated data
 * This includes:
 * - User document in Firestore
 * - Activity history subcollection
 * - Local storage data (history, preferences)
 * - Firebase Auth account
 *
 * Note: Cloud Function `deleteUserData` also runs on account deletion
 * to clean up additional data (kids, rec_history, subscriptions, rate_limits)
 */
export const deleteAccount = async () => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('No user signed in');
    }

    const userId = user.uid;
    console.log('[DeleteAccount] Starting deletion for user:', userId);
    const userRef = usersCollection.doc(userId);

    // 1. Delete activity_history subcollection
    // Firestore doesn't auto-delete subcollections when parent is deleted
    try {
      console.log('[DeleteAccount] Deleting activity_history subcollection...');
      const historySnapshot = await userRef.collection('activity_history').get();
      if (historySnapshot.docs.length > 0) {
        const batch = firestore().batch();
        historySnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`[DeleteAccount] Deleted ${historySnapshot.docs.length} activity_history documents`);
      } else {
        console.log('[DeleteAccount] No activity_history documents to delete');
      }
    } catch (subError) {
      // Continue even if subcollection deletion fails
      console.warn('[DeleteAccount] Error deleting activity_history subcollection:', subError);
    }

    // 2. Delete user document from Firestore
    // Use delete() directly - it's safe even if document doesn't exist
    try {
      console.log('[DeleteAccount] Deleting user document...');
      await userRef.delete();
      console.log('[DeleteAccount] User document deleted (or did not exist)');
    } catch (docError) {
      // Ignore "not-found" errors - document may have been deleted already
      if (docError.code === 'firestore/not-found' || docError.code === 'not-found') {
        console.log('[DeleteAccount] User document did not exist, continuing');
      } else {
        console.warn('[DeleteAccount] Error deleting user document:', docError);
      }
      // Continue regardless - the Cloud Function will clean this up if needed
    }

    // 3. Clear all local storage data
    try {
      console.log('[DeleteAccount] Clearing local storage...');
      const keysToRemove = [
        '@playcompass_history',
        '@playcompass_preferences',
        '@playcompass_kids',
        '@playcompass_cache',
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('[DeleteAccount] Cleared local storage data');
    } catch (storageError) {
      console.warn('[DeleteAccount] Error clearing local storage:', storageError);
    }

    // 4. Sign out from Google if applicable
    try {
      await GoogleSignin.signOut();
      console.log('[DeleteAccount] Signed out from Google');
    } catch (e) {
      // Ignore if not signed in with Google
    }

    // 5. Delete the Firebase Auth account
    // This triggers the Cloud Function `deleteUserData` for additional cleanup
    console.log('[DeleteAccount] Deleting Firebase Auth account...');
    await user.delete();
    console.log('[DeleteAccount] Account deleted successfully');

    return { success: true };
  } catch (error) {
    console.error('[DeleteAccount] Error:', error.code, error.message);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/requires-recent-login') {
      return {
        success: false,
        error: 'Please sign out and sign in again before deleting your account.',
        code: 'requires-recent-login',
      };
    }

    return { success: false, error: error.message };
  }
};

export default {
  signInAnonymously,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOut,
  createOrUpdateUserProfile,
  getUserProfile,
  updateUserPreferences,
  deleteAccount,
};
