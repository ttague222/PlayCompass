/**
 * PlayCompass Accepted Activities Screen
 *
 * Displays list of activities the user liked
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, IconButton, Badge, ScreenWrapper } from '../components';
import { CATEGORIES, DURATIONS } from '../data/activitySchema';

const AcceptedActivitiesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { activities = [] } = route.params || {};

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDone = () => {
    // Navigate back to home (reset stack to avoid deep back navigation)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleActivityPress = (activity) => {
    navigation.navigate('ActivityDetail', { activity });
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
          Your Activities
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
          {/* Header Text */}
          <View style={styles.intro}>
            <Text style={styles.introEmoji}>🎉</Text>
            <Text style={[styles.introTitle, { color: colors.text.primary }]}>
              {activities.length} Activities Ready!
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.text.secondary }]}>
              Here are the activities you picked. Tap any to see more details.
            </Text>
          </View>

          {/* Activities List */}
          {activities.map((activity, index) => {
            const category = CATEGORIES[activity.category?.toUpperCase()];
            const durationInfo = DURATIONS[activity.duration?.toUpperCase()];

            return (
              <TouchableOpacity
                key={activity.id}
                onPress={() => handleActivityPress(activity)}
                activeOpacity={0.7}
              >
                <Card variant="elevated" style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityTitle, { color: colors.text.primary }]}>
                        {activity.title}
                      </Text>
                      <Badge
                        variant="secondary"
                        size="sm"
                        style={{ backgroundColor: category?.color + '20' }}
                      >
                        <Text style={{ color: category?.color, fontSize: 10 }}>
                          {category?.label}
                        </Text>
                      </Badge>
                    </View>
                    <Text style={[styles.activityNumber, { color: colors.text.tertiary }]}>
                      #{index + 1}
                    </Text>
                  </View>

                  <Text
                    style={[styles.activityDescription, { color: colors.text.secondary }]}
                    numberOfLines={2}
                  >
                    {activity.description}
                  </Text>

                  <View style={styles.activityMeta}>
                    <View style={[styles.metaTag, { backgroundColor: colors.surface.secondary }]}>
                      <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                        {durationInfo?.emoji} {durationInfo?.label}
                      </Text>
                    </View>
                    <View style={[styles.metaTag, { backgroundColor: colors.surface.secondary }]}>
                      <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                        {activity.location === 'indoor' ? '🏠 Indoor' : activity.location === 'outdoor' ? '🌤️ Outdoor' : '🔄 Either'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}

          {/* Tips */}
          <Card variant="outlined" style={styles.tipsCard}>
            <Text style={[styles.tipsTitle, { color: colors.text.primary }]}>
              Tips for Success
            </Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>📱</Text>
              <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                Screenshot this list to save for later
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>🔄</Text>
              <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                Come back anytime for fresh suggestions
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>⭐</Text>
              <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                Activities are tailored to your kids' ages
              </Text>
            </View>
          </Card>
        </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface.primary, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button onPress={handleDone} fullWidth>
          Done
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
  intro: {
    alignItems: 'center',
    marginBottom: 24,
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  activityCard: {
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipsCard: {
    padding: 20,
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
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

export default AcceptedActivitiesScreen;
