/**
 * PlayCompass Time Selection Screen
 *
 * User selects how much time they have available for an activity
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useKids } from '../context/KidsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button, IconButton, Chip, ScreenWrapper, Card } from '../components';
import { DURATIONS, LOCATIONS, ENERGY_LEVELS } from '../data/activitySchema';

const TimeSelectScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { kids } = useKids();
  const { usage, checkCanGetRecommendations, tier, allTiers } = useSubscription();
  const insets = useSafeAreaInsets();

  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('both');
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  // Initialize with all kids selected
  const [selectedKidIds, setSelectedKidIds] = useState(() => kids.map((k) => k.id));
  const [recommendationsAllowed, setRecommendationsAllowed] = useState(true);

  // Check recommendation limit on mount
  useEffect(() => {
    const checkLimit = async () => {
      const result = await checkCanGetRecommendations();
      setRecommendationsAllowed(result.allowed);
    };
    checkLimit();
  }, [checkCanGetRecommendations]);

  const toggleKidSelection = (kidId) => {
    setSelectedKidIds((prev) => {
      if (prev.includes(kidId)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== kidId);
      }
      return [...prev, kidId];
    });
  };

  const selectedKids = kids.filter((k) => selectedKidIds.includes(k.id));

  const durationOptions = Object.values(DURATIONS);
  const locationOptions = Object.values(LOCATIONS);
  const energyOptions = Object.values(ENERGY_LEVELS);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGetRecommendations = async () => {
    if (!selectedDuration || selectedKids.length === 0) return;

    // Double-check recommendation limit
    const result = await checkCanGetRecommendations();
    if (!result.allowed) {
      const nextTier = tier === 'free' ? allTiers.plus : tier === 'plus' ? allTiers.family : null;
      const upgradeMessage = nextTier
        ? `\n\nUpgrade to ${nextTier.name} (${nextTier.priceLabel}) for ${nextTier.features.dailyRecommendations === 'unlimited' ? 'unlimited' : nextTier.features.dailyRecommendations} daily recommendations.`
        : '';
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${result.limit} recommendations for today. Come back tomorrow for more!${upgradeMessage}`,
        [
          { text: 'OK', style: 'cancel' },
          ...(nextTier ? [{ text: 'View Plans', onPress: () => navigation.navigate('Subscription') }] : []),
        ]
      );
      return;
    }

    navigation.navigate('Recommendation', {
      duration: selectedDuration,
      location: selectedLocation,
      energy: selectedEnergy,
      selectedKids: selectedKids,
    });
  };

  const canProceed = selectedDuration !== null && selectedKids.length > 0;

  // Calculate bottom bar height including safe area
  const bottomBarHeight = 74 + insets.bottom;

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="←"
          onPress={handleBack}
          variant="ghost"
          size="md"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Find Activity
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
          {/* Usage Indicator */}
          {usage?.recommendations && (
            <TouchableOpacity
              style={[
                styles.usageBanner,
                {
                  backgroundColor: usage.recommendations.remaining === 'unlimited'
                    ? colors.success.light
                    : usage.recommendations.remaining <= 1
                    ? colors.warning.light
                    : colors.primary.light,
                },
              ]}
              onPress={() => navigation.navigate('Subscription')}
              activeOpacity={0.8}
            >
              <Text style={styles.usageIcon}>
                {usage.recommendations.remaining === 'unlimited' ? '✨' : usage.recommendations.remaining <= 1 ? '⚠️' : '🎯'}
              </Text>
              <Text
                style={[
                  styles.usageText,
                  {
                    color: usage.recommendations.remaining === 'unlimited'
                      ? colors.success.dark
                      : usage.recommendations.remaining <= 1
                      ? colors.warning.dark
                      : colors.primary.dark,
                  },
                ]}
              >
                {usage.recommendations.remaining === 'unlimited'
                  ? 'Unlimited recommendations'
                  : `${usage.recommendations.remaining} of ${usage.recommendations.limit} recommendations left today`}
              </Text>
              {tier === 'free' && (
                <Text style={[styles.upgradeHint, { color: colors.primary.main }]}>
                  Upgrade →
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Time Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              How much time do you have?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              Select one option
            </Text>

            <View style={styles.optionsGrid}>
              {durationOptions.map((duration) => (
                <TouchableOpacity
                  key={duration.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor:
                        selectedDuration === duration.id
                          ? colors.primary.main
                          : colors.surface.primary,
                      borderColor:
                        selectedDuration === duration.id
                          ? colors.primary.main
                          : colors.border.light,
                    },
                  ]}
                  onPress={() => setSelectedDuration(duration.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{duration.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color:
                          selectedDuration === duration.id
                            ? '#fff'
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Preference */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Indoor or outdoor?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              Optional - we'll show all if not selected
            </Text>

            <View style={styles.chipRow}>
              {locationOptions.map((location) => (
                <Chip
                  key={location.id}
                  selected={selectedLocation === location.id}
                  onPress={() => setSelectedLocation(location.id)}
                  style={styles.chip}
                >
                  {location.emoji} {location.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Energy Level */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Energy level preference?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              Optional - helps us pick the right mood
            </Text>

            <View style={styles.chipRow}>
              {energyOptions.map((energy) => (
                <Chip
                  key={energy.id}
                  selected={selectedEnergy === energy.id}
                  onPress={() =>
                    setSelectedEnergy(selectedEnergy === energy.id ? null : energy.id)
                  }
                  style={styles.chip}
                >
                  {energy.emoji} {energy.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Kids Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Finding activities for:
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              Tap to select which children to include
            </Text>

            <View style={styles.chipRow}>
              {kids.map((kid) => (
                <Chip
                  key={kid.id}
                  selected={selectedKidIds.includes(kid.id)}
                  onPress={() => toggleKidSelection(kid.id)}
                  style={styles.chip}
                >
                  {kid.avatar} {kid.name} ({kid.age}y)
                </Chip>
              ))}
            </View>
          </View>
        </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface.primary, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button
          onPress={handleGetRecommendations}
          disabled={!canProceed}
          fullWidth
          icon="✨"
        >
          Get Recommendations
        </Button>
      </View>
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
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  optionCard: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  usageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  usageIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  usageText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  upgradeHint: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TimeSelectScreen;
