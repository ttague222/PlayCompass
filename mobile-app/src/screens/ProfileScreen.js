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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ScreenWrapper, IconButton } from '../components';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {
    isAnonymous,
    email,
    displayName,
    photoURL,
    signInWithGoogle,
    signOut,
    deleteAccount,
    loading,
    kids,
    subscription,
  } = useAuth();
  const { colors, isDark, toggleTheme, themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [actionLoading, setActionLoading] = useState(null);

  const handleLinkGoogle = async () => {
    setActionLoading('link');
    await signInWithGoogle();
    setActionLoading(null);
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
              {displayName ? displayName.charAt(0).toUpperCase() : '👤'}
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

      {/* Link Account (for anonymous users) */}
      {isAnonymous && (
        <TouchableOpacity
          style={[styles.linkButton, { borderColor: colors.primary.main }]}
          onPress={handleLinkGoogle}
          disabled={loading || !!actionLoading}
        >
          {actionLoading === 'link' ? (
            <ActivityIndicator color={colors.primary.main} />
          ) : (
            <>
              <Text style={styles.linkIcon}>G</Text>
              <Text style={[styles.linkButtonText, { color: colors.primary.main }]}>
                Link Google Account
              </Text>
            </>
          )}
        </TouchableOpacity>
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
            {subscription?.dailyRecsUsed || 0}
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

  const renderSettingsSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>SETTINGS</Text>

      {/* Theme Toggle */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: colors.border.light }]}
        onPress={toggleTheme}
      >
        <View style={styles.settingLeft}>
          <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
            Dark Mode
          </Text>
        </View>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          {themeMode === 'dark' ? 'On' : 'Off'}
        </Text>
      </TouchableOpacity>

      {/* Notifications (placeholder) */}
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: colors.border.light }]}
      >
        <View style={styles.settingLeft}>
          <Text style={styles.settingIcon}>🔔</Text>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
            Notifications
          </Text>
        </View>
        <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
          On
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
          <>
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={[styles.actionLabel, { color: colors.text.primary }]}>
              Sign Out
            </Text>
          </>
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
          <>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionLabel, { color: colors.error.main }]}>
              Delete Account
            </Text>
          </>
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
        {renderSettingsSection()}
        {renderActionsSection()}

        {/* App Version */}
        <Text style={[styles.version, { color: colors.text.tertiary }]}>
          PlayCompass v1.0.0
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
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
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
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
