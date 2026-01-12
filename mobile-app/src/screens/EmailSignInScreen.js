/**
 * PlayCompass Email Sign In Screen
 *
 * Allows users to sign in or sign up with email and password.
 * Includes password reset functionality.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const EmailSignInScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, resetPassword, loading, isAnonymous } = useAuth();
  const { colors } = useTheme();

  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capture initial anonymous state (won't change during component lifecycle)
  const wasAnonymousRef = useRef(isAnonymous);

  const validateEmail = (emailInput) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailInput);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await signInWithEmail(email, password);
      if (result.success) {
        navigation.goBack();
      } else {
        if (result.code === 'auth/user-not-found') {
          setError('No account found with this email');
        } else if (result.code === 'auth/wrong-password') {
          setError('Incorrect password');
        } else if (result.code === 'auth/invalid-credential') {
          setError('Invalid email or password');
        } else {
          setError(result.error || 'Failed to sign in. Please try again.');
        }
      }
    } catch (err) {
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await signUpWithEmail(email, password);
      if (result.success) {
        // Show success message if user was anonymous (account linking)
        if (wasAnonymousRef.current) {
          Alert.alert(
            'Account Created',
            'Your account has been linked successfully. Your data is now synced across devices.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          navigation.goBack();
        }
      } else {
        if (result.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists');
        } else if (result.code === 'auth/weak-password') {
          setError('Password is too weak');
        } else {
          setError(result.error || 'Failed to create account. Please try again.');
        }
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert(
          'Check Your Email',
          'A password reset link has been sent to your email address.',
          [{ text: 'OK', onPress: () => setMode('signin') }]
        );
      } else {
        if (result.code === 'auth/user-not-found') {
          setError('No account found with this email');
        } else {
          setError(result.error || 'Failed to send reset email. Please try again.');
        }
      }
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Account';
      case 'reset':
        return 'Reset Password';
      default:
        return 'Sign In';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create an account to sync your data across devices';
      case 'reset':
        return 'Enter your email to receive a password reset link';
      default:
        return 'Sign in with your email and password';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {getTitle()}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {getSubtitle()}
          </Text>

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error.light }]}>
              <Ionicons name="warning-outline" size={18} color={colors.error.main} />
              <Text style={[styles.errorText, { color: colors.error.main }]}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={[styles.inputContainer, {
              backgroundColor: colors.surface.secondary,
              borderColor: colors.border.light,
            }]}>
              <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="Email"
                placeholderTextColor={colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input (not shown in reset mode) */}
            {mode !== 'reset' && (
              <View style={[styles.inputContainer, {
                backgroundColor: colors.surface.secondary,
                borderColor: colors.border.light,
              }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Password"
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Confirm Password (only in signup mode) */}
            {mode === 'signup' && (
              <View style={[styles.inputContainer, {
                backgroundColor: colors.surface.secondary,
                borderColor: colors.border.light,
              }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.text.tertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Forgot Password Link (only in signin mode) */}
            {mode === 'signin' && (
              <TouchableOpacity onPress={() => { setMode('reset'); setError(null); }}>
                <Text style={[styles.forgotPassword, { color: colors.primary.main }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary.main }]}
              onPress={
                mode === 'signin' ? handleSignIn :
                mode === 'signup' ? handleSignUp :
                handleResetPassword
              }
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'signin' ? 'Sign In' :
                   mode === 'signup' ? 'Create Account' :
                   'Send Reset Link'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Mode Toggle */}
            <View style={styles.toggleContainer}>
              {mode === 'signin' && (
                <>
                  <Text style={[styles.toggleText, { color: colors.text.secondary }]}>
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => { setMode('signup'); setError(null); }}>
                    <Text style={[styles.toggleLink, { color: colors.primary.main }]}>Sign Up</Text>
                  </TouchableOpacity>
                </>
              )}
              {mode === 'signup' && (
                <>
                  <Text style={[styles.toggleText, { color: colors.text.secondary }]}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => { setMode('signin'); setError(null); }}>
                    <Text style={[styles.toggleLink, { color: colors.primary.main }]}>Sign In</Text>
                  </TouchableOpacity>
                </>
              )}
              {mode === 'reset' && (
                <>
                  <Text style={[styles.toggleText, { color: colors.text.secondary }]}>
                    Remember your password?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => { setMode('signin'); setError(null); }}>
                    <Text style={[styles.toggleLink, { color: colors.primary.main }]}>Sign In</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  forgotPassword: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: -8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmailSignInScreen;
