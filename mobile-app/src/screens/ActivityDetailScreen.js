/**
 * PlayCompass Activity Detail Screen
 *
 * Shows full details of an activity
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, Button, IconButton, Badge, ScreenWrapper, StarRating, RatingModal } from '../components';
import { CATEGORIES, DURATIONS, ENERGY_LEVELS, MATERIALS, AGE_GROUPS } from '../data/activitySchema';
import { isFeatureAvailable } from '../services/subscriptionService';
import { shareActivityKitPDF, printActivityKit } from '../services/printService';

const ActivityDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite, getActivityRating, saveRating } = useFavorites();
  const { effectiveTier, isInTrial } = useSubscription();

  const { activity } = route.params || {};
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [favorited, setFavorited] = useState(activity ? isFavorite(activity.id) : false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Check if user has premium access for detailed instructions (uses effectiveTier for trial support)
  const hasDetailedInstructions = isFeatureAvailable('detailedInstructions', effectiveTier);

  if (!activity) {
    return null;
  }

  const category = CATEGORIES[activity.category?.toUpperCase()];
  const durationInfo = DURATIONS[activity.duration?.toUpperCase()];
  const energyInfo = ENERGY_LEVELS[activity.energy?.toUpperCase()];
  const materialsInfo = MATERIALS[activity.materials?.toUpperCase()];

  const currentRating = getActivityRating(activity.id);

  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleToggleFavorite = async () => {
    const newStatus = await toggleFavorite(activity);
    setFavorited(newStatus);
  };

  const handleRateActivity = () => {
    setShowRatingModal(true);
  };

  const handleSaveRating = async ({ stars, feedback, tags }) => {
    await saveRating(activity.id, stars, feedback, tags);
  };

  const handleStartActivity = () => {
    // Show rating modal after completing
    setShowRatingModal(true);
  };

  const handleFinishAndGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleScheduleActivity = () => {
    navigation.navigate('Schedule', { activityToSchedule: activity });
  };

  const handleSharePDF = async () => {
    setIsPrinting(true);
    try {
      // Transform activity data for the print service
      const activityForPrint = {
        name: activity.title,
        description: activity.description,
        duration: activity.duration,
        category: CATEGORIES[activity.category?.toUpperCase()]?.label || activity.category,
        location: activity.location,
        ageRange: activity.ageGroups?.map(ag => AGE_GROUPS[ag?.toUpperCase()]?.label).filter(Boolean).join(', '),
        materials: activity.materials !== 'none' ? [MATERIALS[activity.materials?.toUpperCase()]?.label || activity.materials] : [],
        instructions: activity.instructions?.map((step, i) => ({ title: `Step ${i + 1}`, description: step })) || [],
        tips: activity.tips || [],
        variations: activity.variations?.map(v => ({ description: v })) || [],
      };

      const result = await shareActivityKitPDF(activityForPrint);
      if (!result.success) {
        Alert.alert('Unable to Share', result.error || 'Could not generate the activity kit. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  const getAgeLabel = (ageGroupId) => {
    const group = AGE_GROUPS[ageGroupId?.toUpperCase()];
    return group ? `${group.emoji} ${group.label}` : ageGroupId;
  };

  // Calculate bottom bar height including safe area
  const bottomBarHeight = 74 + insets.bottom;

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={'\u2190'}
          onPress={handleBack}
          variant="ghost"
          size="md"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Activity Details
        </Text>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={[styles.favoriteButton, { backgroundColor: favorited ? '#e91e6320' : colors.surface.secondary }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.favoriteIcon, { color: favorited ? '#e91e63' : colors.text.secondary }]}>
            {favorited ? '\u2665' : '\u2661'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>{activity.emoji}</Text>
            <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
              {activity.title}
            </Text>
            <Badge
              variant="secondary"
              style={[styles.categoryBadge, { backgroundColor: category?.color + '20' }]}
            >
              <Text style={{ color: category?.color }}>
                {category?.emoji} {category?.label}
              </Text>
            </Badge>
          </View>

          {/* Description */}
          <Card variant="elevated" style={styles.descriptionCard}>
            <Text style={[styles.description, { color: colors.text.primary }]}>
              {activity.description}
            </Text>
          </Card>

          {/* Rating Section */}
          <TouchableOpacity onPress={handleRateActivity} activeOpacity={0.7}>
            <Card variant="outlined" style={styles.ratingCard}>
              <View style={styles.ratingContent}>
                <View style={styles.ratingLeft}>
                  <Text style={[styles.ratingLabel, { color: colors.text.primary }]}>
                    {currentRating ? 'Your Rating' : 'Rate This Activity'}
                  </Text>
                  {currentRating ? (
                    <StarRating rating={currentRating.stars} size="sm" readonly />
                  ) : (
                    <Text style={[styles.ratingHint, { color: colors.text.tertiary }]}>
                      Tap to rate and leave feedback
                    </Text>
                  )}
                </View>
                <Text style={[styles.ratingArrow, { color: colors.text.tertiary }]}>{'\u203A'}</Text>
              </View>
              {currentRating?.feedback && (
                <Text style={[styles.ratingFeedback, { color: colors.text.secondary }]} numberOfLines={2}>
                  "{currentRating.feedback}"
                </Text>
              )}
            </Card>
          </TouchableOpacity>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <View style={[styles.infoBox, { backgroundColor: colors.surface.primary }]}>
              <Text style={styles.infoEmoji}>{durationInfo?.emoji || '⏰'}</Text>
              <Text style={[styles.infoLabel, { color: colors.text.tertiary }]}>Duration</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {durationInfo?.label || activity.duration}
              </Text>
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.surface.primary }]}>
              <Text style={styles.infoEmoji}>
                {activity.location === 'indoor' ? '🏠' : activity.location === 'outdoor' ? '🌤️' : '🔄'}
              </Text>
              <Text style={[styles.infoLabel, { color: colors.text.tertiary }]}>Location</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {activity.location === 'indoor' ? 'Indoor' : activity.location === 'outdoor' ? 'Outdoor' : 'Either'}
              </Text>
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.surface.primary }]}>
              <Text style={styles.infoEmoji}>{energyInfo?.emoji || '😊'}</Text>
              <Text style={[styles.infoLabel, { color: colors.text.tertiary }]}>Energy</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {energyInfo?.label || activity.energy}
              </Text>
            </View>
          </View>

          {/* Materials */}
          {activity.materials !== 'none' && (
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                What You'll Need
              </Text>
              <View style={styles.materialItem}>
                <Text style={styles.materialIcon}>📦</Text>
                <Text style={[styles.materialText, { color: colors.text.secondary }]}>
                  {materialsInfo?.label || activity.materials}
                </Text>
              </View>
            </Card>
          )}

          {/* Age Groups */}
          {activity.ageGroups && activity.ageGroups.length > 0 && (
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Best For Ages
              </Text>
              <View style={styles.ageGroups}>
                {activity.ageGroups.map((ageGroupId) => (
                  <View
                    key={ageGroupId}
                    style={[styles.ageTag, { backgroundColor: colors.surface.secondary }]}
                  >
                    <Text style={[styles.ageTagText, { color: colors.text.secondary }]}>
                      {getAgeLabel(ageGroupId)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Instructions (if available) */}
          {activity.instructions && activity.instructions.length > 0 && (
            <Card variant="outlined" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  How To Do It
                </Text>
                {!hasDetailedInstructions && (
                  <Badge variant="premium" size="sm">
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </Badge>
                )}
                {hasDetailedInstructions && isInTrial && (
                  <Badge variant="secondary" size="sm" style={{ backgroundColor: colors.primary.main + '15' }}>
                    <Text style={{ color: colors.primary.main, fontSize: 10, fontWeight: '600' }}>✨ Bonus Feature</Text>
                  </Badge>
                )}
              </View>
              {hasDetailedInstructions ? (
                activity.instructions.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary.main }]}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.text.secondary }]}>
                      {step}
                    </Text>
                  </View>
                ))
              ) : (
                <TouchableOpacity onPress={handleUpgrade} style={styles.lockedContent}>
                  <View style={[styles.lockedOverlay, { backgroundColor: colors.surface.secondary }]}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={[styles.lockedTitle, { color: colors.text.primary }]}>
                      {activity.instructions.length} Step-by-Step Instructions
                    </Text>
                    <Text style={[styles.lockedDescription, { color: colors.text.secondary }]}>
                      Upgrade to unlock detailed instructions for this activity
                    </Text>
                    <View style={[styles.upgradeButton, { backgroundColor: colors.primary.main }]}>
                      <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* Tips (if available) */}
          {activity.tips && activity.tips.length > 0 && (
            <Card variant="outlined" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Pro Tips
                </Text>
                {!hasDetailedInstructions && (
                  <Badge variant="premium" size="sm">
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </Badge>
                )}
                {hasDetailedInstructions && isInTrial && (
                  <Badge variant="secondary" size="sm" style={{ backgroundColor: colors.primary.main + '15' }}>
                    <Text style={{ color: colors.primary.main, fontSize: 10, fontWeight: '600' }}>✨ Bonus Feature</Text>
                  </Badge>
                )}
              </View>
              {hasDetailedInstructions ? (
                activity.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text style={styles.tipIcon}>💡</Text>
                    <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                      {tip}
                    </Text>
                  </View>
                ))
              ) : (
                <TouchableOpacity onPress={handleUpgrade} style={styles.lockedContent}>
                  <View style={[styles.lockedOverlay, { backgroundColor: colors.surface.secondary }]}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={[styles.lockedTitle, { color: colors.text.primary }]}>
                      {activity.tips.length} Pro Tips Available
                    </Text>
                    <Text style={[styles.lockedDescription, { color: colors.text.secondary }]}>
                      Upgrade to see expert tips and tricks
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* Variations (if available) */}
          {activity.variations && activity.variations.length > 0 && (
            <Card variant="outlined" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Variations to Try
                </Text>
                {!hasDetailedInstructions && (
                  <Badge variant="premium" size="sm">
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </Badge>
                )}
                {hasDetailedInstructions && isInTrial && (
                  <Badge variant="secondary" size="sm" style={{ backgroundColor: colors.primary.main + '15' }}>
                    <Text style={{ color: colors.primary.main, fontSize: 10, fontWeight: '600' }}>✨ Bonus Feature</Text>
                  </Badge>
                )}
              </View>
              {hasDetailedInstructions ? (
                activity.variations.map((variation, index) => (
                  <View key={index} style={styles.variationItem}>
                    <Text style={styles.variationIcon}>🔄</Text>
                    <Text style={[styles.variationText, { color: colors.text.secondary }]}>
                      {variation}
                    </Text>
                  </View>
                ))
              ) : (
                <TouchableOpacity onPress={handleUpgrade} style={styles.lockedContent}>
                  <View style={[styles.lockedOverlay, { backgroundColor: colors.surface.secondary }]}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={[styles.lockedTitle, { color: colors.text.primary }]}>
                      {activity.variations.length} Creative Variations
                    </Text>
                    <Text style={[styles.lockedDescription, { color: colors.text.secondary }]}>
                      Upgrade to discover fun ways to mix things up
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={[styles.tagsLabel, { color: colors.text.tertiary }]}>Tags:</Text>
              <View style={styles.tagsRow}>
                {activity.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.surface.secondary }]}
                  >
                    <Text style={[styles.tagText, { color: colors.text.secondary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Supervision Warning */}
          {activity.adultSupervision && (
            <View style={[styles.warningBox, { backgroundColor: colors.warning.light + '40', borderWidth: 1, borderColor: colors.warning.main }]}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={[styles.warningText, { color: colors.warning.dark }]}>
                Adult supervision recommended for this activity
              </Text>
            </View>
          )}
        </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface.primary, borderTopColor: colors.border.light, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.bottomButtonsRow}>
          <Button
            onPress={handleScheduleActivity}
            variant="outline"
            size="sm"
            style={styles.smallButton}
            icon={'\ud83d\udcc5'}
          >
            Schedule
          </Button>
          <Button
            onPress={handleSharePDF}
            variant="outline"
            size="sm"
            style={styles.smallButton}
            disabled={isPrinting}
          >
            {isPrinting ? <ActivityIndicator size="small" color={colors.primary.main} /> : '\ud83d\udcf2 Share'}
          </Button>
          <Button
            onPress={handleFinishAndGoHome}
            size="sm"
            style={styles.doneButton}
            icon={'\ud83c\udfaf'}
          >
            Do It!
          </Button>
        </View>
      </View>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSaveRating}
        activity={activity}
        initialRating={currentRating}
      />
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
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  descriptionCard: {
    padding: 20,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  ratingCard: {
    padding: 16,
    marginBottom: 20,
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLeft: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingHint: {
    fontSize: 13,
  },
  ratingArrow: {
    fontSize: 24,
    marginLeft: 8,
  },
  ratingFeedback: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  quickInfo: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  infoBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lockedContent: {
    marginTop: -8,
  },
  lockedOverlay: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  upgradeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  materialText: {
    fontSize: 15,
    flex: 1,
  },
  ageGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ageTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    paddingTop: 3,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  variationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  variationIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  variationText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  tagsSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flex: 1,
  },
  doneButton: {
    flex: 1.5,
  },
});

export default ActivityDetailScreen;
