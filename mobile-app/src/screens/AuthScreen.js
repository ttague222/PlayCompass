/**
 * PlayCompass Auth Screen
 *
 * Welcome/login screen with:
 * - Anonymous "Quick Start" option
 * - Google Sign-In for persistent accounts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// Dynamically import LinearGradient to handle cases where native module isn't available
let LinearGradient = null;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  console.warn('[AuthScreen] expo-linear-gradient not available, using fallback');
}
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AuthScreen = () => {
  const { signInAnonymously, signInWithGoogle, loading, authError, clearError } = useAuth();
  const { colors, gradients, isDark } = useTheme();
  const [signingIn, setSigningIn] = useState(null); // 'anonymous' | 'google' | null

  // Dynamic styles based on theme
  const dynamicStyles = {
    appName: {
      color: isDark ? '#FFFFFF' : '#2B2B2B',
    },
    tagline: {
      color: isDark ? 'rgba(255,255,255,0.7)' : '#666666',
    },
    featuresCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
    },
    featureText: {
      color: isDark ? '#FFFFFF' : '#2B2B2B',
    },
    dividerLine: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#D4CFC9',
    },
    dividerText: {
      color: isDark ? 'rgba(255,255,255,0.5)' : '#888888',
    },
    hintText: {
      color: isDark ? 'rgba(255,255,255,0.5)' : '#888888',
    },
    footerText: {
      color: isDark ? 'rgba(255,255,255,0.4)' : '#999999',
    },
  };

  const handleAnonymousSignIn = async () => {
    setSigningIn('anonymous');
    clearError();
    await signInAnonymously();
    setSigningIn(null);
  };

  const handleGoogleSignIn = async () => {
    setSigningIn('google');
    clearError();
    await signInWithGoogle();
    setSigningIn(null);
  };

  const containerContent = (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo & Branding */}
          <View style={styles.brandingSection}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary.main }]}>
              <Text style={styles.logoEmoji}>🧭</Text>
            </View>
            <Text style={[styles.appName, dynamicStyles.appName]}>PlayCompass</Text>
            <Text style={[styles.tagline, dynamicStyles.tagline]}>
              Smart activity ideas for your kids
            </Text>
          </View>

          {/* Features */}
          <View style={[styles.featuresSection, dynamicStyles.featuresCard]}>
            <View style={styles.featureRow}>
              <Text style={styles.featureEmoji}>🎯</Text>
              <Text style={[styles.featureText, dynamicStyles.featureText]}>Age-appropriate activities</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureEmoji}>⏰</Text>
              <Text style={[styles.featureText, dynamicStyles.featureText]}>Fits your available time</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureEmoji}>🌈</Text>
              <Text style={[styles.featureText, dynamicStyles.featureText]}>Indoor & outdoor options</Text>
            </View>
          </View>

          {/* Auth Buttons */}
          <View style={styles.authSection}>
            {/* Google Sign In */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {signingIn === 'google' ? (
                <ActivityIndicator color="#333" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, dynamicStyles.dividerLine]} />
              <Text style={[styles.dividerText, dynamicStyles.dividerText]}>or</Text>
              <View style={[styles.dividerLine, dynamicStyles.dividerLine]} />
            </View>

            {/* Anonymous / Quick Start */}
            <TouchableOpacity
              style={styles.anonymousButton}
              onPress={handleAnonymousSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {LinearGradient ? (
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.anonymousGradient}
                >
                  {signingIn === 'anonymous' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.anonymousIcon}>🚀</Text>
                      <Text style={styles.anonymousButtonText}>Quick Start</Text>
                    </>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.anonymousGradient, { backgroundColor: gradients.primary?.[0] || '#7c3aed' }]}>
                  {signingIn === 'anonymous' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.anonymousIcon}>🚀</Text>
                      <Text style={styles.anonymousButtonText}>Quick Start</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.quickStartHint, dynamicStyles.hintText]}>
              No account needed - sign up later to save your data
            </Text>
          </View>

          {/* Error Message */}
          {authError && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error.light }]}>
              <Text style={[styles.errorText, { color: colors.error.main }]}>{authError}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, dynamicStyles.footerText]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </SafeAreaView>
  );

  if (LinearGradient) {
    return (
      <LinearGradient
        colors={isDark ? ['#1A1F1E', '#252A29', '#2F3534'] : ['#FFFDF8', '#EDE7E1', '#D4CFC9']}
        style={styles.container}
      >
        {containerContent}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A1F1E' : '#FFFDF8' }]}>
      {containerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 20,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 56,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
  },
  featuresSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  authSection: {
    marginBottom: 24,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  anonymousButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4C837A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  anonymousGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  anonymousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  quickStartHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AuthScreen;
