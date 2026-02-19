/**
 * PlayCompass Accepted Activities Screen
 *
 * Displays list of activities the user liked with quick schedule options
 */

import React, { useState } from 'react';
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
import { useScheduler } from '../context/SchedulerContext';
import { Card, Button, IconButton, Badge, ScreenWrapper, ScheduleActivityModal } from '../components';
import { CATEGORIES, DURATIONS } from '../data/activitySchema';

const AcceptedActivitiesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { schedules } = useScheduler();

  const { activities = [] } = route.params || {};

  // State for schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activityToSchedule, setActivityToSchedule] = useState(null);
  const [scheduledActivities, setScheduledActivities] = useState({});

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

  const handleSchedulePress = (activity) => {
    setActivityToSchedule(activity);
    setShowScheduleModal(true);
  };

  const handleScheduled = (activity, scheduledDate) => {
    // Track which activities have been scheduled in this session
    setScheduledActivities(prev => ({
      ...prev,
      [activity.id]: scheduledDate,
    }));
  };

  const handleCloseModal = () => {
    setShowScheduleModal(false);
    setActivityToSchedule(null);
  };

  // Check if an activity is already scheduled
  const isActivityScheduled = (activityId) => {
    // Check session-scheduled activities
    if (scheduledActivities[activityId]) return true;
    // Check global schedules
    return schedules.some(s => s.activity?.id === activityId && !s.completed);
  };

  const getScheduledTime = (activityId) => {
    if (scheduledActivities[activityId]) {
      const date = scheduledActivities[activityId];
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    const schedule = schedules.find(s => s.activity?.id === activityId && !s.completed);
    if (schedule) {
      const date = new Date(schedule.scheduledDate);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return null;
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
            const scheduled = isActivityScheduled(activity.id);
            const scheduledTime = getScheduledTime(activity.id);

            return (
              <Card key={activity.id} variant="elevated" style={styles.activityCard}>
                {/* Scheduled Badge */}
                {scheduled && (
                  <View style={[styles.scheduledBadge, { backgroundColor: colors.success.light }]}>
                    <Text style={[styles.scheduledBadgeText, { color: colors.success.dark }]}>
                      📅 Scheduled for {scheduledTime}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => handleActivityPress(activity)}
                  activeOpacity={0.7}
                >
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
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surface.secondary }]}
                    onPress={() => handleActivityPress(activity)}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.text.secondary }]}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.scheduleButton,
                      { backgroundColor: scheduled ? colors.success.light : colors.primary.main }
                    ]}
                    onPress={() => !scheduled && handleSchedulePress(activity)}
                    disabled={scheduled}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      { color: scheduled ? colors.success.dark : '#fff' }
                    ]}>
                      {scheduled ? '✓ Scheduled' : '📅 Schedule'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

          {/* Tips */}
          <Card variant="outlined" style={styles.tipsCard}>
            <Text style={[styles.tipsTitle, { color: colors.text.primary }]}>
              Tips for Success
            </Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>📅</Text>
              <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                Schedule activities to get reminders
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
                Tap any activity for more details and tips
              </Text>
            </View>
          </Card>
        </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface.primary, borderTopColor: colors.border.light, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button onPress={handleDone} fullWidth>
          Done
        </Button>
      </View>

      {/* Schedule Modal */}
      <ScheduleActivityModal
        visible={showScheduleModal}
        onClose={handleCloseModal}
        activity={activityToSchedule}
        onScheduled={handleScheduled}
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
    overflow: 'hidden',
  },
  scheduledBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    marginHorizontal: -16,
    marginTop: -16,
    alignItems: 'center',
  },
  scheduledBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
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
  },
});

export default AcceptedActivitiesScreen;
