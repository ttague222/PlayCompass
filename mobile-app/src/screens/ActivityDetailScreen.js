/**
 * PlayCompass Activity Detail Screen
 *
 * Shows full details of an activity
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, IconButton, Badge, ScreenWrapper } from '../components';
import { CATEGORIES, DURATIONS, ENERGY_LEVELS, MATERIALS, AGE_GROUPS } from '../data/activitySchema';

const ActivityDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { activity } = route.params || {};

  if (!activity) {
    return null;
  }

  const category = CATEGORIES[activity.category?.toUpperCase()];
  const durationInfo = DURATIONS[activity.duration?.toUpperCase()];
  const energyInfo = ENERGY_LEVELS[activity.energy?.toUpperCase()];
  const materialsInfo = MATERIALS[activity.materials?.toUpperCase()];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartActivity = () => {
    // In future: track activity, start timer, etc.
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
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
          icon="←"
          onPress={handleBack}
          variant="ghost"
          size="md"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Activity Details
        </Text>
        <View style={{ width: 44 }} />
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

          {/* Instructions (if available) */}
          {activity.instructions && activity.instructions.length > 0 && (
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                How To Do It
              </Text>
              {activity.instructions.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary.main }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text.secondary }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Tips (if available) */}
          {activity.tips && activity.tips.length > 0 && (
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Pro Tips
              </Text>
              {activity.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Variations (if available) */}
          {activity.variations && activity.variations.length > 0 && (
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Variations to Try
              </Text>
              {activity.variations.map((variation, index) => (
                <View key={index} style={styles.variationItem}>
                  <Text style={styles.variationIcon}>🔄</Text>
                  <Text style={[styles.variationText, { color: colors.text.secondary }]}>
                    {variation}
                  </Text>
                </View>
              ))}
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
            <View style={[styles.warningBox, { backgroundColor: colors.warning.light }]}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={[styles.warningText, { color: colors.warning.main }]}>
                Adult supervision recommended for this activity
              </Text>
            </View>
          )}
        </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface.primary, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button onPress={handleStartActivity} fullWidth icon="🎯">
          Let's Do This!
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
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
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
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});

export default ActivityDetailScreen;
