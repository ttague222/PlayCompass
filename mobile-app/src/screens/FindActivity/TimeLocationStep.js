/**
 * Find Activity - Step 2: Time & Location
 *
 * Select how much time you have and indoor/outdoor preference
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { Button, IconButton, ScreenWrapper } from '../../components';
import { DURATIONS, LOCATIONS } from '../../data/activitySchema';

const TimeLocationStep = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { usage, checkCanGetRecommendations, hasPremiumLifetime } = useSubscription();
  const insets = useSafeAreaInsets();

  const { selectedKids } = route.params;

  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('both');

  const durationOptions = Object.values(DURATIONS);
  const locationOptions = Object.values(LOCATIONS);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    navigation.navigate('PreferencesStep', {
      selectedKids,
      duration: selectedDuration,
      location: selectedLocation,
    });
  };

  const handleSkipToResults = async () => {
    // Check recommendation limit
    const result = await checkCanGetRecommendations();
    if (!result.allowed) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${result.limit} recommendations for today. Come back tomorrow for more!`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Unlock More', onPress: () => navigation.navigate('Store') },
        ]
      );
      return;
    }

    navigation.navigate('Recommendation', {
      duration: selectedDuration,
      location: selectedLocation,
      energy: null,
      materials: null,
      selectedKids,
      weather: null,
      seasonFilter: null,
    });
  };

  const canProceed = selectedDuration !== null;
  const bottomBarHeight = 100 + insets.bottom;

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Find Activity
          </Text>
          <Text style={[styles.stepIndicator, { color: colors.text.secondary }]}>
            Step 2 of 3
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface.secondary }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary.main, width: '66%' }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Usage Indicator */}
        {usage?.recommendations && !hasPremiumLifetime && (
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
            onPress={() => navigation.navigate('Store')}
            activeOpacity={0.8}
          >
            <Text style={styles.usageIcon}>
              {usage.recommendations.remaining <= 1 ? '⚠️' : '🎯'}
            </Text>
            <Text
              style={[
                styles.usageText,
                {
                  color: usage.recommendations.remaining <= 1
                    ? colors.warning.dark
                    : colors.primary.dark,
                },
              ]}
            >
              {`${usage.recommendations.remaining} of ${usage.recommendations.limit} recommendations left today`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Time Selection */}
        <View style={styles.questionSection}>
          <Text style={styles.emoji}>⏰</Text>
          <Text style={[styles.questionTitle, { color: colors.text.primary }]}>
            How much time?
          </Text>
          <Text style={[styles.questionSubtitle, { color: colors.text.secondary }]}>
            Select one option
          </Text>
        </View>

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

        {/* Location Selection */}
        <View style={[styles.questionSection, { marginTop: 32 }]}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={[styles.questionTitle, { color: colors.text.primary }]}>
            Indoor or outdoor?
          </Text>
          <Text style={[styles.questionSubtitle, { color: colors.text.secondary }]}>
            Optional preference
          </Text>
        </View>

        <View style={styles.locationRow}>
          {locationOptions.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                {
                  backgroundColor:
                    selectedLocation === location.id
                      ? colors.primary.main
                      : colors.surface.primary,
                  borderColor:
                    selectedLocation === location.id
                      ? colors.primary.main
                      : colors.border.light,
                },
              ]}
              onPress={() => setSelectedLocation(location.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.locationEmoji}>{location.emoji}</Text>
              <Text
                style={[
                  styles.locationLabel,
                  {
                    color:
                      selectedLocation === location.id
                        ? '#fff'
                        : colors.text.primary,
                  },
                ]}
              >
                {location.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface.primary,
            borderTopColor: colors.border.light,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View style={styles.bottomButtonsRow}>
          <Button
            onPress={handleSkipToResults}
            disabled={!canProceed}
            variant="secondary"
            style={styles.skipButton}
          >
            Find Now
          </Button>
          <Button
            onPress={handleNext}
            disabled={!canProceed}
            style={styles.nextButton}
            icon="→"
            iconPosition="right"
          >
            More Filters
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    height: 4,
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  questionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  locationEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});

export default TimeLocationStep;
