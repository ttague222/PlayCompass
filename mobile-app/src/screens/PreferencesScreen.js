/**
 * PlayCompass Preferences Screen
 *
 * Allows users to configure AI personalization preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { useSubscription } from '../context/SubscriptionContext';
import { ScreenWrapper, TopBar, Card, Button, Chip } from '../components/ui';

const CATEGORIES = [
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'physical', label: 'Physical', emoji: '⚽' },
  { id: 'educational', label: 'Educational', emoji: '📚' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { id: 'indoor', label: 'Indoor', emoji: '🏠' },
  { id: 'social', label: 'Social', emoji: '👥' },
  { id: 'cooking', label: 'Cooking', emoji: '👨‍🍳' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
];

const ENERGY_LEVELS = [
  { id: 'low', label: 'Calm', emoji: '😌', description: 'Relaxed, quiet activities' },
  { id: 'medium', label: 'Moderate', emoji: '😊', description: 'Balanced energy level' },
  { id: 'high', label: 'Active', emoji: '🏃', description: 'High-energy activities' },
];

const DURATIONS = [
  { id: 'quick', label: 'Quick', emoji: '⚡', description: '15 min or less' },
  { id: 'medium', label: 'Medium', emoji: '⏱️', description: '15-30 minutes' },
  { id: 'long', label: 'Extended', emoji: '🕐', description: '30+ minutes' },
];

const PreferencesScreen = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const {
    preferences,
    setPreference,
    insights,
    resetPersonalization,
    loading,
  } = usePersonalization();
  const { isPremium } = useSubscription();

  const [saving, setSaving] = useState(false);

  const handleCategoryToggle = async (categoryId, isPreferred) => {
    const preferred = [...(preferences?.preferredCategories || [])];
    const avoid = [...(preferences?.avoidCategories || [])];

    if (isPreferred) {
      // Add to preferred, remove from avoid
      if (!preferred.includes(categoryId)) preferred.push(categoryId);
      const avoidIndex = avoid.indexOf(categoryId);
      if (avoidIndex > -1) avoid.splice(avoidIndex, 1);
    } else {
      // Remove from preferred
      const prefIndex = preferred.indexOf(categoryId);
      if (prefIndex > -1) preferred.splice(prefIndex, 1);
    }

    await setPreference('preferredCategories', preferred);
    await setPreference('avoidCategories', avoid);
  };

  const handleAvoidCategory = async (categoryId) => {
    const preferred = [...(preferences?.preferredCategories || [])];
    const avoid = [...(preferences?.avoidCategories || [])];

    if (avoid.includes(categoryId)) {
      // Remove from avoid
      const avoidIndex = avoid.indexOf(categoryId);
      avoid.splice(avoidIndex, 1);
    } else {
      // Add to avoid, remove from preferred
      avoid.push(categoryId);
      const prefIndex = preferred.indexOf(categoryId);
      if (prefIndex > -1) preferred.splice(prefIndex, 1);
    }

    await setPreference('preferredCategories', preferred);
    await setPreference('avoidCategories', avoid);
  };

  const handleEnergyChange = async (level) => {
    await setPreference('energyLevel', level);
  };

  const handleDurationToggle = async (durationId) => {
    const durations = [...(preferences?.preferredDurations || [])];
    const index = durations.indexOf(durationId);

    if (index > -1) {
      durations.splice(index, 1);
    } else {
      durations.push(durationId);
    }

    await setPreference('preferredDurations', durations);
  };

  const handleTimePreferenceToggle = async (timeKey) => {
    const times = { ...(preferences?.preferredTimes || {}) };
    times[timeKey] = !times[timeKey];
    await setPreference('preferredTimes', times);
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'This will clear all your learned preferences and start fresh. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetPersonalization();
            Alert.alert('Done', 'Your preferences have been reset.');
          },
        },
      ]
    );
  };

  const getCategoryStatus = (categoryId) => {
    if (preferences?.preferredCategories?.includes(categoryId)) return 'preferred';
    if (preferences?.avoidCategories?.includes(categoryId)) return 'avoid';
    return 'neutral';
  };

  return (
    <ScreenWrapper>
      <TopBar
        title="Preferences"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Insights Preview */}
        {insights?.hasEnoughData && (
          <Card style={styles.insightsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Your Activity Insights
            </Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>🎯</Text>
                <Text style={[styles.insightValue, { color: colors.primary.main }]}>
                  {insights.totalActivities}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>
                  Activities
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>⏱️</Text>
                <Text style={[styles.insightValue, { color: colors.success.main }]}>
                  {insights.averageDuration}m
                </Text>
                <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>
                  Avg Duration
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>⭐</Text>
                <Text style={[styles.insightValue, { color: '#FFD700' }]}>
                  {insights.bestRatedCategory || '-'}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>
                  Top Category
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Category Preferences */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Category Preferences
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Tap to prefer, long press to avoid
          </Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => {
              const status = getCategoryStatus(category.id);
              return (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        status === 'preferred'
                          ? colors.primary.main + '20'
                          : status === 'avoid'
                          ? colors.error.main + '20'
                          : colors.background.secondary,
                      borderColor:
                        status === 'preferred'
                          ? colors.primary.main
                          : status === 'avoid'
                          ? colors.error.main
                          : colors.border.light,
                    },
                  ]}
                  onPress={() =>
                    handleCategoryToggle(category.id, status !== 'preferred')
                  }
                  onLongPress={() => handleAvoidCategory(category.id)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        color:
                          status === 'preferred'
                            ? colors.primary.main
                            : status === 'avoid'
                            ? colors.error.main
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {category.label}
                  </Text>
                  {status === 'preferred' && (
                    <Text style={styles.statusIcon}>✓</Text>
                  )}
                  {status === 'avoid' && (
                    <Text style={styles.statusIcon}>✕</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Energy Level */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Energy Level
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            What kind of activities do you prefer?
          </Text>

          <View style={styles.optionsRow}>
            {ENERGY_LEVELS.map((level) => (
              <Pressable
                key={level.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor:
                      preferences?.energyLevel === level.id
                        ? colors.primary.main + '20'
                        : colors.background.secondary,
                    borderColor:
                      preferences?.energyLevel === level.id
                        ? colors.primary.main
                        : colors.border.light,
                  },
                ]}
                onPress={() => handleEnergyChange(level.id)}
              >
                <Text style={styles.optionEmoji}>{level.emoji}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color:
                        preferences?.energyLevel === level.id
                          ? colors.primary.main
                          : colors.text.primary,
                    },
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.text.tertiary }]}>
                  {level.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Duration Preferences */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Activity Duration
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Select your preferred activity lengths
          </Text>

          <View style={styles.optionsRow}>
            {DURATIONS.map((duration) => {
              const isSelected = preferences?.preferredDurations?.includes(duration.id);
              return (
                <Pressable
                  key={duration.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? colors.primary.main + '20'
                        : colors.background.secondary,
                      borderColor: isSelected
                        ? colors.primary.main
                        : colors.border.light,
                    },
                  ]}
                  onPress={() => handleDurationToggle(duration.id)}
                >
                  <Text style={styles.optionEmoji}>{duration.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isSelected ? colors.primary.main : colors.text.primary },
                    ]}
                  >
                    {duration.label}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.text.tertiary }]}>
                    {duration.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Time Preferences */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Preferred Times
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            When do you usually do activities?
          </Text>

          <View style={styles.timePreferences}>
            {[
              { key: 'morning', label: 'Morning', emoji: '🌅' },
              { key: 'afternoon', label: 'Afternoon', emoji: '☀️' },
              { key: 'evening', label: 'Evening', emoji: '🌙' },
              { key: 'weekend', label: 'Weekends', emoji: '📅' },
            ].map((time) => (
              <View
                key={time.key}
                style={[styles.timeRow, { borderBottomColor: colors.border.light }]}
              >
                <View style={styles.timeInfo}>
                  <Text style={styles.timeEmoji}>{time.emoji}</Text>
                  <Text style={[styles.timeLabel, { color: colors.text.primary }]}>
                    {time.label}
                  </Text>
                </View>
                <Switch
                  value={preferences?.preferredTimes?.[time.key] || false}
                  onValueChange={() => handleTimePreferenceToggle(time.key)}
                  trackColor={{
                    false: colors.neutral[300],
                    true: colors.primary.main + '60',
                  }}
                  thumbColor={
                    preferences?.preferredTimes?.[time.key]
                      ? colors.primary.main
                      : colors.neutral[100]
                  }
                />
              </View>
            ))}
          </View>
        </Card>

        {/* Reset Button */}
        <View style={styles.resetSection}>
          <Button
            variant="outline"
            onPress={handleResetPreferences}
            style={{ borderColor: colors.error.main }}
            textStyle={{ color: colors.error.main }}
          >
            Reset All Preferences
          </Button>
          <Text style={[styles.resetNote, { color: colors.text.tertiary }]}>
            This will clear learned preferences and start fresh
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  insightsCard: {
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  insightItem: {
    alignItems: 'center',
  },
  insightEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  insightLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 6,
    fontSize: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  timePreferences: {
    gap: 0,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  timeLabel: {
    fontSize: 16,
  },
  resetSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  resetNote: {
    fontSize: 12,
    marginTop: 8,
  },
});

export default PreferencesScreen;
