/**
 * Find Activity - Step 3: Preferences
 *
 * Optional filters: energy level, materials, weather-aware, seasonal
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { Button, IconButton, Chip, ScreenWrapper } from '../../components';
import { ENERGY_LEVELS } from '../../data/activitySchema';
import {
  getCurrentWeather,
  getWeatherEmoji,
} from '../../services/weatherService';

const PreferencesStep = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { checkCanGetRecommendations, checkFeature, hasPremiumLifetime } = useSubscription();
  const insets = useSafeAreaInsets();

  const { selectedKids, duration, location } = route.params;

  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState(null);
  const [weather, setWeather] = useState(null);
  const [useWeatherFilter, setUseWeatherFilter] = useState(true);
  const [seasonalFilter, setSeasonalFilter] = useState(null);

  const energyOptions = Object.values(ENERGY_LEVELS);
  const materialsOptions = [
    { id: 'none', label: 'No supplies needed', emoji: '✨' },
    { id: 'basic', label: 'Basic items only', emoji: '🧺' },
    { id: 'any', label: 'Any supplies OK', emoji: '📦' },
  ];

  // Premium features
  const hasWeatherFeature = checkFeature('weatherAware');
  const hasSeasonalFeature = checkFeature('seasonalActivities');

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

  // Fetch weather on mount
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const result = await getCurrentWeather();
        if (result.success) {
          setWeather(result.weather);
        } else if (result.fallback) {
          setWeather(result.fallback);
        }
      } catch (error) {
        console.log('Weather fetch error:', error);
      }
    };
    fetchWeather();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFindActivities = async () => {
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
      duration,
      location,
      energy: selectedEnergy,
      materials: selectedMaterials === 'any' ? null : selectedMaterials,
      selectedKids,
      weather: hasWeatherFeature && useWeatherFilter ? weather : null,
      seasonFilter: hasSeasonalFeature ? seasonalFilter : null,
    });
  };

  const bottomBarHeight = 90 + insets.bottom;

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
            Step 3 of 3
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface.secondary }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary.main, width: '100%' }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introSection}>
          <Text style={styles.emoji}>🎛️</Text>
          <Text style={[styles.introTitle, { color: colors.text.primary }]}>
            Fine-tune your search
          </Text>
          <Text style={[styles.introSubtitle, { color: colors.text.secondary }]}>
            All filters are optional
          </Text>
        </View>

        {/* Energy Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Energy level?
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

        {/* Materials */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Supplies available?
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

        {/* Weather Banner */}
        {weather && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitleInline, { color: colors.text.primary }]}>
                Weather-aware
              </Text>
              {!hasWeatherFeature && (
                <TouchableOpacity
                  style={[styles.premiumBadge, { backgroundColor: colors.primary.light }]}
                  onPress={() => navigation.navigate('Store')}
                >
                  <Text style={[styles.premiumBadgeText, { color: colors.primary.dark }]}>
                    👑 Premium
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.weatherCard, { backgroundColor: colors.surface.secondary }]}>
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
                    {useWeatherFilter ? '✓ On' : 'Off'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.weatherToggle, { backgroundColor: colors.surface.tertiary }]}
                  onPress={() => navigation.navigate('Store')}
                >
                  <Text style={[styles.weatherToggleText, { color: colors.text.tertiary }]}>
                    🔒
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Seasonal Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleInline, { color: colors.text.primary }]}>
              Seasonal activities?
            </Text>
            {!hasSeasonalFeature && (
              <TouchableOpacity
                style={[styles.premiumBadge, { backgroundColor: colors.primary.light }]}
                onPress={() => navigation.navigate('Store')}
              >
                <Text style={[styles.premiumBadgeText, { color: colors.primary.dark }]}>
                  👑 Premium
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
              onPress={() => hasSeasonalFeature ? setSeasonalFilter('current') : navigation.navigate('Store')}
              style={[styles.chip, !hasSeasonalFeature && styles.chipDisabled]}
            >
              {seasonEmojis[currentSeason]} {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Only
            </Chip>
          </View>
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
        <Button
          onPress={handleFindActivities}
          style={styles.findButton}
          icon="✨"
        >
          Find Activities
        </Button>
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
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  weatherToggleText: {
    fontSize: 13,
    fontWeight: '600',
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
  findButton: {
    width: '100%',
  },
});

export default PreferencesStep;
