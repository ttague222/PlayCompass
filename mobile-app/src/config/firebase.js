/**
 * PlayCompass Firebase Configuration
 *
 * Firebase is configured via app.json plugins for native modules.
 * This file provides the Firebase instances for use throughout the app.
 */

import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase is auto-initialized via google-services.json (Android) and GoogleService-Info.plist (iOS)
// No manual initialization needed when using @react-native-firebase with Expo plugins

// Export Firebase services
export const firebaseAuth = auth;
export const db = firestore;

// Helper to get current user
export const getCurrentUser = () => auth().currentUser;

// Helper to check if user is signed in
export const isSignedIn = () => !!auth().currentUser;

export default {
  auth: firebaseAuth,
  db,
  getCurrentUser,
  isSignedIn,
};
