/**
 * PlayCompass Add/Edit Kid Screen
 *
 * Form to add or edit a child profile
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useKids } from '../context/KidsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button, Input, Card, Chip, Avatar, IconButton, ScreenWrapper } from '../components';

const AddKidScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { addKid, updateKid, removeKid, getKidById, canAddKid, maxKids, INTERESTS, KID_AVATARS, loading } = useKids();
  const { effectiveTier, allTiers } = useSubscription();
  const insets = useSafeAreaInsets();

  // Check if editing existing kid
  const editKidId = route.params?.kidId;
  const existingKid = editKidId ? getKidById(editKidId) : null;
  const isEditing = !!existingKid;

  // Form state
  const [name, setName] = useState(existingKid?.name || '');
  const [age, setAge] = useState(existingKid?.age?.toString() || '');
  const [avatar, setAvatar] = useState(existingKid?.avatar || '🧒');
  const [interests, setInterests] = useState(existingKid?.interests || []);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Validation
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 30) {
      newErrors.name = 'Name must be 30 characters or less';
    }

    const ageNum = parseInt(age, 10);
    if (!age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(ageNum) || ageNum < 1 || ageNum > 18) {
      newErrors.age = 'Age must be between 1 and 18';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // Check subscription limit for new kids
    if (!isEditing && !canAddKid) {
      const nextTier = effectiveTier === 'free' ? allTiers.plus : effectiveTier === 'plus' ? allTiers.family : null;
      const upgradeMessage = nextTier
        ? `\n\nUpgrade to ${nextTier.name} (${nextTier.priceLabel}) for up to ${nextTier.features.maxKids} children.`
        : '';
      Alert.alert(
        'Limit Reached',
        `You've reached your limit of ${maxKids} children on your current plan.${upgradeMessage}`,
        [
          { text: 'OK', style: 'cancel' },
          ...(nextTier ? [{ text: 'View Plans', onPress: () => navigation.navigate('Subscription') }] : []),
        ]
      );
      return;
    }

    const kidData = {
      name: name.trim(),
      age: parseInt(age, 10),
      avatar,
      interests,
    };

    let result;
    if (isEditing) {
      result = await updateKid(editKidId, kidData);
    } else {
      result = await addKid(kidData);
    }

    if (result.success) {
      navigation.goBack();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeKid(editKidId);
            if (result.success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const toggleInterest = (interestId) => {
    setInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId]
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="←"
            onPress={() => navigation.goBack()}
            variant="ghost"
          />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {isEditing ? 'Edit Child' : 'Add Child'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
            {/* Avatar Selection */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setShowAvatarPicker(!showAvatarPicker)}
              >
                <Avatar emoji={avatar} size="xl" color={colors.primary.main} />
                <View style={[styles.editBadge, { backgroundColor: colors.secondary.main }]}>
                  <Text style={styles.editBadgeText}>✏️</Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarHint, { color: colors.text.secondary }]}>
                Tap to change avatar
              </Text>
            </View>

            {/* Avatar Picker */}
            {showAvatarPicker && (
              <Card variant="filled" style={styles.avatarPicker}>
                <View style={styles.avatarGrid}>
                  {KID_AVATARS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.avatarOption,
                        avatar === emoji && {
                          backgroundColor: colors.primary.light + '30',
                          borderColor: colors.primary.main,
                        },
                      ]}
                      onPress={() => {
                        setAvatar(emoji);
                        setShowAvatarPicker(false);
                      }}
                    >
                      <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            )}

            {/* Name Input */}
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter child's name"
              error={errors.name}
              leftIcon="👤"
            />

            {/* Age Input */}
            <Input
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="1-18"
              keyboardType="number-pad"
              error={errors.age}
              leftIcon="🎂"
              maxLength={2}
            />

            {/* Interests */}
            <View style={styles.interestsSection}>
              <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                INTERESTS (optional)
              </Text>
              <Text style={[styles.sectionHint, { color: colors.text.tertiary }]}>
                Select activities they enjoy
              </Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest) => (
                  <Chip
                    key={interest.id}
                    icon={interest.emoji}
                    selected={interests.includes(interest.id)}
                    onPress={() => toggleInterest(interest.id)}
                    size="md"
                    style={styles.interestChip}
                  >
                    {interest.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                onPress={handleSave}
                loading={loading}
                fullWidth
                icon={isEditing ? '✓' : '➕'}
              >
                {isEditing ? 'Save Changes' : 'Add Child'}
              </Button>

              {isEditing && (
                <Button
                  onPress={handleDelete}
                  variant="ghost"
                  fullWidth
                  style={styles.deleteButton}
                  textStyle={{ color: colors.error.main }}
                >
                  Remove Child
                </Button>
              )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarButton: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadgeText: {
    fontSize: 14,
  },
  avatarHint: {
    fontSize: 14,
    marginTop: 8,
  },
  avatarPicker: {
    marginBottom: 24,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  interestsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    marginBottom: 16,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    marginBottom: 4,
  },
  actions: {
    marginTop: 16,
  },
  deleteButton: {
    marginTop: 12,
  },
});

export default AddKidScreen;
