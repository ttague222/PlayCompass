/**
 * PlayCompass Family Screen
 *
 * Manage family sharing settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Dynamically import Clipboard to handle cases where native module isn't available
let Clipboard = null;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  console.warn('[FamilyScreen] @react-native-clipboard/clipboard not available');
}
import { useFamily } from '../context/FamilyContext';
import { useSubscription } from '../context/SubscriptionContext';
import { ScreenWrapper, TopBar, Card, Button, Badge, Avatar } from '../components/ui';

const FamilyScreen = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const {
    family,
    members,
    loading,
    inviteCode,
    isOwner,
    isAdmin,
    hasFamily,
    createFamily,
    generateInvite,
    joinFamily,
    leaveFamily,
    removeMember,
    updateMemberRole,
  } = useFamily();
  const { hasFeature } = useSubscription();

  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const isPremium = hasFeature('customActivities'); // Family sharing is a premium feature

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }

    setCreating(true);
    const result = await createFamily(familyName.trim());
    setCreating(false);

    if (result.success) {
      Alert.alert('Success', 'Family created! You can now invite members.');
    } else {
      Alert.alert('Error', result.error || 'Failed to create family');
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setJoining(true);
    const result = await joinFamily(joinCode.trim());
    setJoining(false);

    if (result.success) {
      Alert.alert('Success', 'You have joined the family!');
      setShowJoinForm(false);
      setJoinCode('');
    } else {
      Alert.alert('Error', result.error || 'Failed to join family');
    }
  };

  const handleGenerateInvite = async () => {
    const result = await generateInvite();
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to generate invite');
    }
  };

  const handleShareInvite = async () => {
    if (!inviteCode) return;

    try {
      await Share.share({
        message: `Join our family on PlayCompass! Use invite code: ${inviteCode}`,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    if (Clipboard) {
      Clipboard.setString(inviteCode);
      Alert.alert('Copied', 'Invite code copied to clipboard');
    } else {
      Alert.alert('Code', `Your invite code is: ${inviteCode}`);
    }
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      'Leave Family',
      'Are you sure you want to leave this family? You will lose access to shared kids and history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const result = await leaveFamily();
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to leave family');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.displayName} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeMember(member.id);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (member) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    Alert.alert(
      'Change Role',
      `Make ${member.displayName} ${newRole === 'admin' ? 'an admin' : 'a regular member'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const result = await updateMemberRole(member.id, newRole);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to change role');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return '#FFD700';
      case 'admin':
        return colors.primary.main;
      default:
        return colors.text.secondary;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', variant: 'warning' };
      case 'admin':
        return { label: 'Admin', variant: 'primary' };
      default:
        return { label: 'Member', variant: 'default' };
    }
  };

  // Premium upsell
  if (!isPremium) {
    return (
      <ScreenWrapper>
        <TopBar title="Family" showBack onBack={() => navigation.goBack()} />
        <View style={styles.premiumContainer}>
          <Text style={styles.premiumEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
            Family Sharing
          </Text>
          <Text style={[styles.premiumDesc, { color: colors.text.secondary }]}>
            Share kids, activities, and history with family members. Everyone stays on
            the same page!
          </Text>
          <Button
            variant="primary"
            onPress={() => navigation.navigate('Subscription')}
            style={styles.upgradeButton}
          >
            Upgrade to Premium
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  // No family yet
  if (!hasFamily) {
    return (
      <ScreenWrapper>
        <TopBar title="Family" showBack onBack={() => navigation.goBack()} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.noFamilyContainer}
        >
          <Text style={styles.welcomeEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={[styles.welcomeTitle, { color: colors.text.primary }]}>
            Family Sharing
          </Text>
          <Text style={[styles.welcomeDesc, { color: colors.text.secondary }]}>
            Create a family to share kids and activities with other family members
          </Text>

          {/* Create Family */}
          <Card style={styles.actionCard}>
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              Create a Family
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderColor: colors.border.light,
                },
              ]}
              placeholder="Family name (e.g., The Smiths)"
              placeholderTextColor={colors.text.tertiary}
              value={familyName}
              onChangeText={setFamilyName}
            />
            <Button
              variant="primary"
              onPress={handleCreateFamily}
              loading={creating}
            >
              Create Family
            </Button>
          </Card>

          {/* Join Family */}
          <Card style={styles.actionCard}>
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              Join a Family
            </Text>
            {showJoinForm ? (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  placeholder="Enter invite code"
                  placeholderTextColor={colors.text.tertiary}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                />
                <View style={styles.joinButtons}>
                  <Button
                    variant="outline"
                    onPress={() => setShowJoinForm(false)}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleJoinFamily}
                    loading={joining}
                    style={styles.joinButton}
                  >
                    Join
                  </Button>
                </View>
              </>
            ) : (
              <Button variant="outline" onPress={() => setShowJoinForm(true)}>
                I have an invite code
              </Button>
            )}
          </Card>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // Has family
  return (
    <ScreenWrapper>
      <TopBar title="Family" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Family Header */}
        <Card style={styles.familyHeader}>
          <Text style={styles.familyEmoji}>🏠</Text>
          <Text style={[styles.familyName, { color: colors.text.primary }]}>
            {family.name}
          </Text>
          <Text style={[styles.memberCount, { color: colors.text.secondary }]}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </Card>

        {/* Invite Section */}
        {isAdmin && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Invite Members
            </Text>
            {inviteCode ? (
              <View style={styles.inviteCodeContainer}>
                <View
                  style={[
                    styles.codeBox,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <Text style={[styles.codeText, { color: colors.primary.main }]}>
                    {inviteCode}
                  </Text>
                </View>
                <View style={styles.inviteActions}>
                  <Pressable
                    style={[styles.inviteAction, { backgroundColor: colors.primary.main }]}
                    onPress={handleCopyCode}
                  >
                    <Text style={styles.inviteActionText}>Copy</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.inviteAction,
                      { backgroundColor: colors.success.main },
                    ]}
                    onPress={handleShareInvite}
                  >
                    <Text style={styles.inviteActionText}>Share</Text>
                  </Pressable>
                </View>
                <Text style={[styles.codeNote, { color: colors.text.tertiary }]}>
                  Code expires in 7 days
                </Text>
              </View>
            ) : (
              <Button variant="outline" onPress={handleGenerateInvite}>
                Generate Invite Code
              </Button>
            )}
          </Card>
        )}

        {/* Members List */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Family Members
          </Text>
          <View style={styles.membersList}>
            {members.map((member) => {
              const roleBadge = getRoleBadge(member.role);
              return (
                <View
                  key={member.id}
                  style={[
                    styles.memberCard,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <Avatar name={member.displayName} size={44} />
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text.primary }]}>
                      {member.displayName}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.text.secondary }]}>
                      {member.email}
                    </Text>
                  </View>
                  <Badge variant={roleBadge.variant} size="sm">
                    {roleBadge.label}
                  </Badge>

                  {/* Member actions (for owner) */}
                  {isOwner && !member.isOwner && (
                    <View style={styles.memberActions}>
                      <Pressable
                        style={styles.memberAction}
                        onPress={() => handleChangeRole(member)}
                      >
                        <Text style={{ color: colors.primary.main }}>Role</Text>
                      </Pressable>
                      <Pressable
                        style={styles.memberAction}
                        onPress={() => handleRemoveMember(member)}
                      >
                        <Text style={{ color: colors.error.main }}>Remove</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Card>

        {/* Leave Family */}
        {!isOwner && (
          <View style={styles.leaveSection}>
            <Button
              variant="outline"
              onPress={handleLeaveFamily}
              style={{ borderColor: colors.error.main }}
              textStyle={{ color: colors.error.main }}
            >
              Leave Family
            </Button>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  premiumDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    minWidth: 200,
  },
  noFamilyContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  actionCard: {
    width: '100%',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  joinButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  joinButton: {
    flex: 1,
  },
  familyHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  familyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  familyName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  inviteCodeContainer: {
    alignItems: 'center',
  },
  codeBox: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  inviteAction: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  codeNote: {
    fontSize: 12,
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 13,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 8,
  },
  memberAction: {
    padding: 4,
  },
  leaveSection: {
    marginTop: 16,
    alignItems: 'center',
  },
});

export default FamilyScreen;
