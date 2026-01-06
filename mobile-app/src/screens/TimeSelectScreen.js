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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useKids } from '../context/KidsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button, IconButton, Chip, ScreenWrapper, Card } from '../components';
import { DURATIONS, LOCATIONS, ENERGY_LEVELS, MATERIALS } from '../data/activitySchema';
import { getRandomActivity } from '../services/apiService';
import {
  getCurrentWeather,
  getWeatherEmoji,
  getWeatherSuggestions,
  getActivityWeatherTag,
} from '../services/weatherService';

const TimeSelectScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { kids } = useKids();
  const { usage, checkCanGetRecommendations, effectiveTier, allTiers, checkFeature } = useSubscription();
  const insets = useSafeAreaInsets();

  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('both');
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState(null);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  // Initialize with all kids selected
  const [selectedKidIds, setSelectedKidIds] = useState(() => kids.map((k) => k.id));
  const [recommendationsAllowed, setRecommendationsAllowed] = useState(true);

  // Weather and seasonal states
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [useWeatherFilter, setUseWeatherFilter] = useState(true);
  const [seasonalFilter, setSeasonalFilter] = useState(null); // null = all, 'current' = current season only

  // Check recommendation limit on mount
  useEffect(() => {
    const checkLimit = async () => {
      const result = await checkCanGetRecommendations();
      setRecommendationsAllowed(result.allowed);
    };
    checkLimit();
  }, [checkCanGetRecommendations]);

  // Fetch weather on mount
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const result = await getCurrentWeather();
        if (result.success) {
          setWeather(result.weather);
        } else if (result.fallback) {
          setWeather(result.fallback);
        }
      } catch (error) {
        console.log('Weather fetch error:', error);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const currentSeason = getCurrentSeason();
  const seasonEmojis = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️' };

  // Check feature availability (available during trial via effectiveTier)
  const hasWeatherFeature = checkFeature('weatherAware');
  const hasSeasonalFeature = checkFeature('seasonalActivities');

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
  const materialsOptions = [
    { id: 'none', label: 'No supplies', emoji: '✨' },
    { id: 'basic', label: 'Basic items', emoji: '🧺' },
    { id: 'any', label: 'Any', emoji: '📦' },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSurpriseMe = async () => {
    if (selectedKids.length === 0) {
      Alert.alert('Select Kids', 'Please select at least one child first.');
      return;
    }

    // Check recommendation limit
    const result = await checkCanGetRecommendations();
    if (!result.allowed) {
      const nextTier = effectiveTier === 'free' ? allTiers.plus : effectiveTier === 'plus' ? allTiers.family : null;
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

    setSurpriseLoading(true);
    try {
      const ages = selectedKids.map((k) => k.age);
      const response = await getRandomActivity(
        ages,
        selectedLocation !== 'both' ? selectedLocation : null,
        selectedEnergy
      );

      if (response.activity) {
        // Navigate directly to the activity with the surprise activity
        navigation.navigate('Recommendation', {
          duration: response.activity.duration || 'medium',
          location: selectedLocation,
          energy: selectedEnergy,
          selectedKids: selectedKids,
          surpriseActivity: response.activity,
        });
      } else {
        Alert.alert('Oops!', 'Could not find a surprise activity. Try again!');
      }
    } catch (error) {
      console.error('Surprise me error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSurpriseLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedDuration || selectedKids.length === 0) return;

    // Double-check recommendation limit
    const result = await checkCanGetRecommendations();
    if (!result.allowed) {
      const nextTier = effectiveTier === 'free' ? allTiers.plus : effectiveTier === 'plus' ? allTiers.family : null;
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
      materials: selectedMaterials,
      selectedKids: selectedKids,
      // Only pass weather/seasonal filters if user has access
      weather: hasWeatherFeature && useWeatherFilter ? weather : null,
      seasonFilter: hasSeasonalFeature ? seasonalFilter : null,
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
              {effectiveTier === 'free' && (
                <Text style={[styles.upgradeHint, { color: colors.primary.main }]}>
                  Upgrade →
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Weather Banner */}
          {weather && (
            <View style={[styles.weatherBanner, { backgroundColor: colors.surface.secondary }]}>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.condition)}</Text>
                <View style={styles.weatherText}>
                  <Text style={[styles.weatherTemp, { color: colors.text.primary }]}>
                    {Math.round(weather.temperature)}° in {weather.city}
                  </Text>
                  <Text style={[styles.weatherDesc, { color: colors.text.secondary }]}>
                    {weather.description}
                  </Text>
                </View>
              </View>
              {hasWeatherFeature ? (
                <TouchableOpacity
                  style={[
                    styles.weatherToggle,
                    { backgroundColor: useWeatherFilter ? colors.primary.main : colors.surface.tertiary }
                  ]}
                  onPress={() => setUseWeatherFilter(!useWeatherFilter)}
                >
                  <Text style={[styles.weatherToggleText, { color: useWeatherFilter ? '#fff' : colors.text.secondary }]}>
                    {useWeatherFilter ? 'Weather-Aware' : 'Ignore Weather'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.weatherToggle, { backgroundColor: colors.surface.tertiary }]}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Text style={[styles.weatherToggleText, { color: colors.text.tertiary }]}>
                    🔒 Plus
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Seasonal Filter */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Seasonal activities?
              </Text>
              {!hasSeasonalFeature && (
                <TouchableOpacity
                  style={[styles.plusBadge, { backgroundColor: colors.primary.light }]}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Text style={[styles.plusBadgeText, { color: colors.primary.dark }]}>
                    🔒 Plus
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              {hasSeasonalFeature
                ? 'Filter for activities that fit the current season'
                : 'Upgrade to filter by season'}
            </Text>

            <View style={styles.chipRow}>
              <Chip
                selected={seasonalFilter === null}
                onPress={() => hasSeasonalFeature && setSeasonalFilter(null)}
                style={[styles.chip, !hasSeasonalFeature && styles.chipDisabled]}
                disabled={!hasSeasonalFeature}
              >
                📅 All Year
              </Chip>
              <Chip
                selected={hasSeasonalFeature && seasonalFilter === 'current'}
                onPress={() => hasSeasonalFeature ? setSeasonalFilter('current') : navigation.navigate('Subscription')}
                style={[styles.chip, !hasSeasonalFeature && styles.chipDisabled]}
              >
                {seasonEmojis[currentSeason]} {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Only
              </Chip>
            </View>
          </View>

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

          {/* Materials/Supplies */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Supplies available?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              Optional - filter by what you have on hand
            </Text>

            <View style={styles.chipRow}>
              {materialsOptions.map((mat) => (
                <Chip
                  key={mat.id}
                  selected={selectedMaterials === mat.id}
                  onPress={() =>
                    setSelectedMaterials(selectedMaterials === mat.id ? null : mat.id)
                  }
                  style={styles.chip}
                >
                  {mat.emoji} {mat.label}
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
      <View style={[styles.bottomBar, { backgroundColor: colors.surface.primary, borderTopColor: colors.border.light, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.bottomButtonsRow}>
          <Button
            onPress={handleSurpriseMe}
            disabled={selectedKids.length === 0 || surpriseLoading}
            loading={surpriseLoading}
            variant="outline"
            style={styles.surpriseButton}
            icon="🎲"
          >
            Surprise Me
          </Button>
          <Button
            onPress={handleGetRecommendations}
            disabled={!canProceed}
            style={styles.recommendButton}
            icon="✨"
          >
            Find Activities
          </Button>
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  plusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  plusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
  chipDisabled: {
    opacity: 0.5,
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
  surpriseButton: {
    flex: 1,
  },
  recommendButton: {
    flex: 1,
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
  weatherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  weatherText: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '600',
  },
  weatherDesc: {
    fontSize: 13,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  weatherToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  weatherToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TimeSelectScreen;
