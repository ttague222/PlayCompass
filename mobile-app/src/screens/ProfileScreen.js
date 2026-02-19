/**
 * PlayCompass Profile Screen
 *
 * User profile and settings:
 * - Account info
 * - Link anonymous account to Google
 * - Sign out / Delete account
 * - App settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import { ScreenWrapper, IconButton } from '../components';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {
    isAnonymous,
    email,
    displayName,
    photoURL,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    deleteAccount,
    loading,
    kids,
  } = useAuth();
  const { colors, isDark, toggleTheme, themeMode } = useTheme();
  const { subscription, usage } = useSubscription();
  const insets = useSafeAreaInsets();
  const [actionLoading, setActionLoading] = useState(null);

  // Get URLs from app config
  const privacyPolicyUrl = Constants.expoConfig?.extra?.privacyPolicyUrl || 'https://watchlightinteractive.com/playcompass-privacy-policy';
  const termsOfServiceUrl = Constants.expoConfig?.extra?.termsOfServiceUrl || 'https://watchlightinteractive.com/playcompass-terms-of-service';

  const openPrivacyPolicy = () => Linking.openURL(privacyPolicyUrl);
  const openTermsOfService = () => Linking.openURL(termsOfServiceUrl);

  const handleLinkGoogle = async () => {
    // Capture anonymous state before sign-in (it will change after linking)
    const wasAnonymous = isAnonymous;

    setActionLoading('link');
    const result = await signInWithGoogle();
    setActionLoading(null);

    // Show success message when anonymous user links with Google
    if (result.success && wasAnonymous) {
      Alert.alert(
        'Account Linked',
        'Your Google account has been linked successfully. Your data is now synced across devices.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('signout');
            await signOut();
            setActionLoading(null);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('delete');
            const result = await deleteAccount();
            if (!result.success) {
              Alert.alert('Error', result.error);
            }
            setActionLoading(null);
          },
        },
      ]
    );
  };

  const renderAccountSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>ACCOUNT</Text>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary.main }]}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          )}
        </View>
        <View style={styles.profileDetails}>
          <Text style={[styles.profileName, { color: colors.text.primary }]}>
            {displayName || 'Guest User'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
            {email || 'Anonymous Account'}
          </Text>
          {isAnonymous && (
            <View style={[styles.badge, { backgroundColor: colors.warning.main }]}>
              <Text style={styles.badgeText}>Guest</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sign In Options (for anonymous/guest users) */}
      {isAnonymous && (
        <View style={styles.signInOptions}>
          <Text style={[styles.signInPrompt, { color: colors.text.secondary }]}>
            Sign in to sync your data across devices
          </Text>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.linkButton, { borderColor: '#4285F4', marginBottom: 10 }]}
            onPress={handleLinkGoogle}
            disabled={loading || !!actionLoading}
          >
            {actionLoading === 'link' ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Text style={styles.linkIcon}>G</Text>
                <Text style={[styles.linkButtonText, { color: '#4285F4' }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email Sign In */}
          <TouchableOpacity
            style={[styles.linkButton, { borderColor: colors.primary.main }]}
            onPress={() => navigation.navigate('EmailSignIn')}
            disabled={loading || !!actionLoading}
          >
            <Text style={[styles.emailIcon, { color: colors.primary.main }]}>@</Text>
            <Text style={[styles.linkButtonText, { color: colors.primary.main }]}>
              Continue with Email
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStatsSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>STATS</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary.main }]}>
            {kids?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Kids
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.secondary.main }]}>
            {usage?.recommendations?.used || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Recs Today
          </Text>
        </View>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={[styles.statValue, { color: colors.success.main }]}>
            {subscription?.tier === 'plus' ? 'Plus' : subscription?.tier === 'family' ? 'Family' : 'Free'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Plan →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMyStuffSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>MY STUFF</Text>

      {/* Saved Activities */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: colors.border.light }]}
        onPress={() => navigation.navigate('SavedActivities')}
      >
        <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
          Saved Activities
        </Text>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          →
        </Text>
      </TouchableOpacity>

      {/* My Activities (Custom) */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: 'transparent' }]}
        onPress={() => navigation.navigate('CustomActivities')}
      >
        <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
          My Activities
        </Text>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          →
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>SETTINGS</Text>

      {/* Theme Toggle */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: colors.border.light }]}
        onPress={toggleTheme}
      >
        <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
          Dark Mode
        </Text>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          {themeMode === 'dark' ? 'On' : 'Off'}
        </Text>
      </TouchableOpacity>

      {/* Notifications (placeholder) */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: colors.border.light }]}
      >
        <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
          Notifications
        </Text>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          On
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLegalSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>LEGAL</Text>

      {/* Privacy Policy */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: colors.border.light }]}
        onPress={openPrivacyPolicy}
      >
        <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
          Privacy Policy
        </Text>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          ↗
        </Text>
      </TouchableOpacity>

      {/* Terms of Service */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: 'transparent' }]}
        onPress={openTermsOfService}
      >
        <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
          Terms of Service
        </Text>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          ↗
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderActionsSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>ACTIONS</Text>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.actionRow, { borderBottomColor: colors.border.light }]}
        onPress={handleSignOut}
        disabled={!!actionLoading}
      >
        {actionLoading === 'signout' ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : (
          <Text style={[styles.actionLabel, { color: colors.text.primary }]}>
            Sign Out
          </Text>
        )}
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity
        style={styles.actionRow}
        onPress={handleDeleteAccount}
        disabled={!!actionLoading}
      >
        {actionLoading === 'delete' ? (
          <ActivityIndicator color={colors.error.main} />
        ) : (
          <Text style={[styles.actionLabel, { color: colors.error.main }]}>
            Delete Account
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
      {/* Header with back button */}
      <View style={styles.headerRow}>
        <IconButton
          icon="←"
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>

        {renderAccountSection()}
        {renderStatsSection()}
        {renderMyStuffSection()}
        {renderSettingsSection()}
        {renderLegalSection()}
        {renderActionsSection()}

        {/* App Version */}
        <Text style={[styles.version, { color: colors.text.tertiary }]}>
          PlayCompass v{Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  linkIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 8,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  signInOptions: {
    marginTop: 8,
  },
  signInPrompt: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});

export default ProfileScreen;
