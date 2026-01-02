/**
 * PlayCompass Auth Context
 *
 * Manages Firebase authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  signInAnonymously as authSignInAnonymously,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  getUserProfile,
  deleteAccount as authDeleteAccount,
} from '../services/authService';
import { resetUsageStats } from '../services/subscriptionService';
import { Analytics, setUser as setCrashUser, addBreadcrumb } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  // Track if account deletion is in progress to prevent listener errors
  const isDeletingAccount = useRef(false);
  // Store profile unsubscribe function so we can call it during deletion
  const profileUnsubscribeRef = useRef(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      // Skip processing if we're in the middle of deleting the account
      if (isDeletingAccount.current) {
        return;
      }

      setUser(authUser);

      if (authUser) {
        // Fetch user profile from Firestore
        const result = await getUserProfile(authUser.uid);
        if (result.success) {
          setUserProfile(result.profile);
        }
        // Set user context for crash reporting
        setCrashUser(authUser);
        addBreadcrumb('User authenticated', 'auth', { isAnonymous: authUser.isAnonymous });
      } else {
        setUserProfile(null);
        setCrashUser(null);
      }

      if (initializing) {
        setInitializing(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [initializing]);

  // Listen for profile changes in real-time
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          // Skip processing if we're deleting the account
          if (isDeletingAccount.current) {
            return;
          }
          if (doc.exists) {
            setUserProfile(doc.data());
          }
          // If doc doesn't exist, the profile will be created by authService
          // and this listener will pick it up when it's ready
        },
        (error) => {
          // Skip errors during account deletion
          if (isDeletingAccount.current) {
            return;
          }
          // Ignore "not-found" errors - document may not exist yet for new users
          if (error.code === 'firestore/not-found' || error.code === 'not-found') {
            console.log('User profile not found yet, waiting for creation...');
            return;
          }
          console.error('Profile listener error:', error);
        }
      );

    // Store reference so we can unsubscribe during account deletion
    profileUnsubscribeRef.current = unsubscribe;

    return unsubscribe;
  }, [user?.uid]);

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

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    addBreadcrumb('User signing out', 'auth');
    const result = await authSignOut();
    if (result.success) {
      Analytics.signOut();
    } else {
      setAuthError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  // Delete account
  const deleteAccount = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    try {
      // Set flag to prevent listener errors during deletion
      isDeletingAccount.current = true;

      // Unsubscribe from profile listener before deletion
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }

      // Clear profile state immediately
      setUserProfile(null);

      // Small delay to ensure listener is fully detached
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

  const value = {
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

    // Profile data shortcuts
    kids: userProfile?.kids ?? [],
    subscription: userProfile?.subscription ?? { tier: 'free' },
    preferences: userProfile?.preferences ?? {},

    // Auth methods
    signInAnonymously,
    signInWithGoogle,
    signOut,
    deleteAccount,
    clearError,
  };

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
