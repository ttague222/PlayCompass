/**
 * PlayCompass Auth Context
 *
 * Manages Firebase authentication state and provides auth methods
 *
 * NOTE: Real-time Firestore listener has been REMOVED to prevent race conditions
 * when adding kids. Profile is fetched once on auth, and kids are updated locally.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import auth from '@react-native-firebase/auth';
import {
  signInAnonymously as authSignInAnonymously,
  signInWithGoogle as authSignInWithGoogle,
  signInWithEmail as authSignInWithEmail,
  signUpWithEmail as authSignUpWithEmail,
  resetPassword as authResetPassword,
  signOut as authSignOut,
  getUserProfile,
  deleteAccount as authDeleteAccount,
} from '../services/authService';
import { resetUsageStats } from '../services/subscriptionService';
import { registerPushToken, unregisterPushToken } from '../services/pushNotificationService';
import { Analytics, setUser as setCrashUser, addBreadcrumb } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  // Local kids state - updated manually, no real-time listener
  const [kidsOverride, setKidsOverride] = useState(null);
  // Track if account deletion is in progress
  const isDeletingAccount = useRef(false);
  // Store user ID for profile operations
  const userIdRef = useRef(null);

  // Listen for auth state changes and fetch profile ONCE (no real-time listener)
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      // Skip processing if we're in the middle of deleting the account
      if (isDeletingAccount.current) {
        return;
      }

      setUser(authUser);

      if (authUser) {
        // Store user ID
        userIdRef.current = authUser.uid;

        // Fetch user profile ONCE from Firestore (no real-time listener)
        const result = await getUserProfile(authUser.uid);
        if (result.success) {
          setUserProfile(result.profile);
        }
        // Set user context for crash reporting
        setCrashUser(authUser);
        addBreadcrumb('User authenticated', 'auth', { isAnonymous: authUser.isAnonymous });

        // Register push notification token
        registerPushToken(authUser.uid).then((tokenResult) => {
          if (tokenResult.success) {
            addBreadcrumb('Push token registered', 'notification');
          }
        });
      } else {
        userIdRef.current = null;
        setUserProfile(null);
        setKidsOverride(null);
        setCrashUser(null);
      }

      if (initializing) {
        setInitializing(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [initializing]);

  // NO REAL-TIME LISTENER - Profile is fetched once on auth
  // Kids are updated locally via setKidsLocally

  // Sign in anonymously
  const signInAnonymously = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    addBreadcrumb('Attempting anonymous sign in', 'auth');
    const result = await authSignInAnonymously();
    if (result.success) {
      Analytics.signIn('anonymous');
    } else {
      setAuthError(result.error);
      Analytics.error('auth', result.error, 'signInAnonymously');
    }
    setLoading(false);
    return result;
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    addBreadcrumb('Attempting Google sign in', 'auth');
    const result = await authSignInWithGoogle();
    if (result.success) {
      Analytics.signIn('google');
    } else {
      setAuthError(result.error);
      Analytics.error('auth', result.error, 'signInWithGoogle');
    }
    setLoading(false);
    return result;
  }, []);

  // Sign in with email
  const signInWithEmail = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError(null);
    addBreadcrumb('Attempting email sign in', 'auth');
    const result = await authSignInWithEmail(email, password);
    if (result.success) {
      Analytics.signIn('email');
    } else {
      setAuthError(result.error);
      Analytics.error('auth', result.error, 'signInWithEmail');
    }
    setLoading(false);
    return result;
  }, []);

  // Sign up with email
  const signUpWithEmail = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError(null);
    addBreadcrumb('Attempting email sign up', 'auth');
    const result = await authSignUpWithEmail(email, password);
    if (result.success) {
      Analytics.signUp('email');
    } else {
      setAuthError(result.error);
      Analytics.error('auth', result.error, 'signUpWithEmail');
    }
    setLoading(false);
    return result;
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    setAuthError(null);
    addBreadcrumb('Attempting password reset', 'auth');
    const result = await authResetPassword(email);
    if (!result.success) {
      setAuthError(result.error);
      Analytics.error('auth', result.error, 'resetPassword');
    }
    setLoading(false);
    return result;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    addBreadcrumb('User signing out', 'auth');

    // Unregister push token before signing out
    if (user?.uid) {
      await unregisterPushToken(user.uid);
    }

    const result = await authSignOut();
    if (result.success) {
      Analytics.signOut();
    } else {
      setAuthError(result.error);
    }
    setLoading(false);
    return result;
  }, [user?.uid]);

  // Delete account
  const deleteAccount = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    try {
      // Set flag to prevent errors during deletion
      isDeletingAccount.current = true;

      // Clear profile state immediately
      setUserProfile(null);
      setKidsOverride(null);

      // Small delay to ensure state is cleared
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await authDeleteAccount();
      if (!result.success) {
        // Reset flag if deletion failed
        isDeletingAccount.current = false;
        setAuthError(result.error);
      } else {
        // Clear user state on success
        setUser(null);
        // Reset daily usage limits so new account starts fresh
        await resetUsageStats();
        // Reset flag after successful deletion so future sign-ins work
        isDeletingAccount.current = false;
      }
      setLoading(false);
      return result;
    } catch (error) {
      // Catch any unexpected errors to prevent app crash
      console.error('[AuthContext] Unexpected error during deleteAccount:', error);
      isDeletingAccount.current = false;
      setAuthError(error.message || 'An unexpected error occurred');
      setLoading(false);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }, []);

  // Clear auth error
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Set kids locally - simple state update, no real-time listener to worry about
  const setKidsLocally = useCallback((newKids) => {
    console.log('[AuthContext] Setting kids locally:', newKids?.length || 0);
    setKidsOverride(newKids);
  }, []);

  // Refresh profile from Firestore (call manually when needed)
  const refreshProfile = useCallback(async () => {
    if (!userIdRef.current) return { success: false, error: 'No user logged in' };

    console.log('[AuthContext] Refreshing profile from Firestore');
    const result = await getUserProfile(userIdRef.current);
    if (result.success) {
      setUserProfile(result.profile);
      setKidsOverride(null); // Clear override to use fresh data
    }
    return result;
  }, []);

  // Stabilize derived values to prevent new object/array references on every render
  const kids = useMemo(
    () => kidsOverride ?? userProfile?.kids ?? [],
    [kidsOverride, userProfile?.kids]
  );

  const subscription = useMemo(
    () => userProfile?.subscription ?? { tier: 'free' },
    [userProfile?.subscription]
  );

  const preferences = useMemo(
    () => userProfile?.preferences ?? {},
    [userProfile?.preferences]
  );

  const value = useMemo(() => ({
    // User state
    user,
    userProfile,
    loading,
    initializing,
    authError,

    // Computed values
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous ?? false,
    userId: user?.uid ?? null,
    email: user?.email ?? null,
    displayName: user?.displayName ?? userProfile?.displayName ?? null,
    photoURL: user?.photoURL ?? userProfile?.photoURL ?? null,

    // Profile data shortcuts - using pre-memoized stable references
    kids,
    subscription,
    preferences,

    // Auth methods (all useCallback-wrapped, stable references)
    signInAnonymously,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    deleteAccount,
    clearError,
    setKidsLocally,
    refreshProfile,
  }), [
    user, userProfile, loading, initializing, authError,
    kids, subscription, preferences,
    signInAnonymously, signInWithGoogle, signInWithEmail, signUpWithEmail,
    resetPassword, signOut, deleteAccount, clearError, setKidsLocally, refreshProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
