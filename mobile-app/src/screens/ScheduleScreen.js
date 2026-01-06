/**
 * PlayCompass Schedule Screen
 *
 * View and manage scheduled activities with calendar view
 */

import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useScheduler } from '../context/SchedulerContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, Button, IconButton, Badge, ScreenWrapper } from '../components';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ScheduleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { checkFeature } = useSubscription();
  const {
    schedules,
    upcomingActivities,
    cancelSchedule,
    completeSchedule,
    scheduleActivity,
    notificationsEnabled,
    requestNotifications,
  } = useScheduler();

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Activity scheduling modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activityToSchedule, setActivityToSchedule] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('morning');
  const [isScheduling, setIsScheduling] = useState(false);

  // Time slots for scheduling (expanded options)
  const TIME_SLOTS = [
    { id: 'early_morning', label: 'Early Morning', time: '7:00 AM', hour: 7 },
    { id: 'morning', label: 'Morning', time: '9:00 AM', hour: 9 },
    { id: 'late_morning', label: 'Late Morning', time: '10:30 AM', hour: 10, minute: 30 },
    { id: 'midday', label: 'Midday', time: '12:00 PM', hour: 12 },
    { id: 'early_afternoon', label: 'Early Afternoon', time: '2:00 PM', hour: 14 },
    { id: 'afternoon', label: 'Afternoon', time: '3:30 PM', hour: 15, minute: 30 },
    { id: 'late_afternoon', label: 'Late Afternoon', time: '5:00 PM', hour: 17 },
    { id: 'evening', label: 'Evening', time: '6:30 PM', hour: 18, minute: 30 },
  ];

  // Handle incoming activity to schedule
  useEffect(() => {
    if (route.params?.activityToSchedule) {
      setActivityToSchedule(route.params.activityToSchedule);
      // Set initial schedule date to selected date with a reasonable time (e.g., 10 AM)
      const initialDate = new Date(selectedDate);
      initialDate.setHours(10, 0, 0, 0);
      setScheduleDate(initialDate);
      setShowScheduleModal(true);
      // Clear the param so it doesn't re-trigger
      navigation.setParams({ activityToSchedule: undefined });
    }
  }, [route.params?.activityToSchedule]);

  // Check premium access (uses effectiveTier, so trial users have access)
  const hasSchedulingAccess = checkFeature('scheduling');

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedDate]);

  // Get schedules for selected date
  const selectedDateSchedules = useMemo(() => {
    const targetDate = selectedDate.toDateString();
    return schedules.filter((s) => {
      const scheduleDate = new Date(s.scheduledDate).toDateString();
      return scheduleDate === targetDate;
    });
  }, [schedules, selectedDate]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleCompleteActivity = async (scheduleId) => {
    Alert.alert(
      'Complete Activity',
      'Mark this activity as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await completeSchedule(scheduleId);
          },
        },
      ]
    );
  };

  const handleCancelActivity = async (scheduleId) => {
    Alert.alert(
      'Cancel Activity',
      'Remove this scheduled activity?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await cancelSchedule(scheduleId);
          },
        },
      ]
    );
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotifications();
    if (result?.granted) {
      Alert.alert('Notifications Enabled', 'You will receive reminders for scheduled activities.');
    } else if (result?.error) {
      Alert.alert('Notifications Unavailable', result.error);
    } else {
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in your device settings to receive activity reminders.',
        [{ text: 'OK' }]
      );
    }
  };

  // Schedule modal handlers
  const handleSelectDate = (date) => {
    const newDate = new Date(date);
    const slot = TIME_SLOTS.find(s => s.id === selectedTimeSlot);
    newDate.setHours(slot?.hour || 9, slot?.minute || 0, 0, 0);
    setScheduleDate(newDate);
  };

  const handleSelectTimeSlot = (slotId) => {
    setSelectedTimeSlot(slotId);
    const slot = TIME_SLOTS.find(s => s.id === slotId);
    const newDate = new Date(scheduleDate);
    newDate.setHours(slot?.hour || 9, slot?.minute || 0, 0, 0);
    setScheduleDate(newDate);
  };

  const handleConfirmSchedule = async () => {
    if (!activityToSchedule) return;

    setIsScheduling(true);
    try {
      const result = await scheduleActivity(activityToSchedule, scheduleDate);
      if (result.success) {
        setShowScheduleModal(false);
        setActivityToSchedule(null);
        // Select the date we just scheduled for
        setSelectedDate(scheduleDate);
        Alert.alert(
          'Activity Scheduled!',
          `${activityToSchedule.title} has been scheduled for ${scheduleDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })} at ${scheduleDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
        );
      } else {
        Alert.alert('Error', 'Failed to schedule activity. Please try again.');
      }
    } catch (error) {
      console.error('Error scheduling activity:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelScheduleModal = () => {
    setShowScheduleModal(false);
    setActivityToSchedule(null);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getScheduleCountForDate = (date) => {
    const targetDate = date.toDateString();
    return schedules.filter((s) => new Date(s.scheduledDate).toDateString() === targetDate).length;
  };

  const renderWeekView = () => (
    <View style={styles.weekContainer}>
      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={handlePreviousWeek}
          style={[styles.weekNavButton, { backgroundColor: colors.surface.secondary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.weekNavText, { color: colors.primary.main }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.weekTitle, { color: colors.text.primary }]}>
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
          {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <TouchableOpacity
          onPress={handleNextWeek}
          style={[styles.weekNavButton, { backgroundColor: colors.surface.secondary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.weekNavText, { color: colors.primary.main }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={styles.weekDays}>
        {weekDates.map((date, index) => {
          const scheduleCount = getScheduleCountForDate(date);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayItem,
                isSelected(date) && { backgroundColor: colors.primary.main },
                isToday(date) && !isSelected(date) && { borderColor: colors.primary.main, borderWidth: 2 },
              ]}
              onPress={() => handleDateSelect(date)}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: isSelected(date) ? '#fff' : colors.text.tertiary },
                ]}
              >
                {DAYS_OF_WEEK[index]}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: isSelected(date) ? '#fff' : colors.text.primary },
                ]}
              >
                {date.getDate()}
              </Text>
              {scheduleCount > 0 && (
                <View
                  style={[
                    styles.dayBadge,
                    { backgroundColor: isSelected(date) ? '#fff' : colors.primary.main },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayBadgeText,
                      { color: isSelected(date) ? colors.primary.main : '#fff' },
                    ]}
                  >
                    {scheduleCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderScheduleItem = (schedule) => (
    <Card key={schedule.id} variant="outlined" style={styles.scheduleCard}>
      <View style={styles.scheduleContent}>
        <Text style={styles.scheduleEmoji}>{schedule.activity.emoji}</Text>
        <View style={styles.scheduleInfo}>
          <Text style={[styles.scheduleTitle, { color: colors.text.primary }]}>
            {schedule.activity.title}
          </Text>
          <Text style={[styles.scheduleTime, { color: colors.text.secondary }]}>
            {formatTime(schedule.scheduledDate)}
          </Text>
          {schedule.notes && (
            <Text style={[styles.scheduleNotes, { color: colors.text.tertiary }]} numberOfLines={1}>
              {schedule.notes}
            </Text>
          )}
        </View>
        <View style={styles.scheduleActions}>
          {!schedule.completed ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success.light }]}
                onPress={() => handleCompleteActivity(schedule.id)}
              >
                <Text style={styles.actionIcon}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error.light }]}
                onPress={() => handleCancelActivity(schedule.id)}
              >
                <Text style={styles.actionIcon}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Badge variant="success" size="sm">
              <Text style={{ color: '#fff' }}>Done</Text>
            </Badge>
          )}
        </View>
      </View>
    </Card>
  );

  const renderSelectedDaySchedules = () => (
    <View style={styles.daySchedules}>
      <Text style={[styles.daySchedulesTitle, { color: colors.text.primary }]}>
        {isToday(selectedDate)
          ? "Today's Activities"
          : `${FULL_DAYS[selectedDate.getDay()]}, ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
      </Text>

      {selectedDateSchedules.length > 0 ? (
        selectedDateSchedules
          .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
          .map(renderScheduleItem)
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface.secondary }]}>
            <Text style={[styles.emptyIconText, { color: colors.text.tertiary }]}>🗓️</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No activities scheduled
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Find an activity and schedule it for this day
          </Text>
          <Button
            onPress={() => navigation.navigate('TimeSelect')}
            variant="primary"
            style={styles.findActivityButton}
          >
            Find Activity
          </Button>
        </Card>
      )}
    </View>
  );

  const renderUpcomingActivities = () => (
    <View style={styles.upcomingSection}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Upcoming This Week
      </Text>
      {upcomingActivities.length > 0 ? (
        upcomingActivities.slice(0, 5).map((schedule) => (
          <TouchableOpacity
            key={schedule.id}
            style={[styles.upcomingItem, { backgroundColor: colors.surface.secondary }]}
            onPress={() => handleDateSelect(new Date(schedule.scheduledDate))}
          >
            <Text style={styles.upcomingEmoji}>{schedule.activity.emoji}</Text>
            <View style={styles.upcomingInfo}>
              <Text style={[styles.upcomingTitle, { color: colors.text.primary }]}>
                {schedule.activity.title}
              </Text>
              <Text style={[styles.upcomingDate, { color: colors.text.secondary }]}>
                {new Date(schedule.scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={[styles.upcomingArrow, { color: colors.text.tertiary }]}>›</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={[styles.noUpcoming, { color: colors.text.tertiary }]}>
          No upcoming activities scheduled
        </Text>
      )}
    </View>
  );

  if (!hasSchedulingAccess) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <IconButton icon="←" onPress={handleBack} variant="ghost" size="md" />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Schedule</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.premiumRequired}>
          <Text style={styles.premiumEmoji}>📅</Text>
          <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
            Activity Scheduling
          </Text>
          <Text style={[styles.premiumText, { color: colors.text.secondary }]}>
            Plan your week with scheduled activities and reminders. Upgrade to Premium to access this feature.
          </Text>
          <Button
            onPress={() => navigation.navigate('Subscription')}
            style={styles.upgradeButton}
          >
            Upgrade to Premium
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="←" onPress={handleBack} variant="ghost" size="md" />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Schedule</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Notification Banner */}
      {!notificationsEnabled && (
        <TouchableOpacity
          style={[styles.notificationBanner, { backgroundColor: colors.primary.main }]}
          onPress={handleEnableNotifications}
          activeOpacity={0.8}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          <Text style={[styles.notificationText, { color: '#FFFFFF' }]}>
            Enable notifications for reminders
          </Text>
          <View style={styles.enableButton}>
            <Text style={[styles.enableButtonText, { color: colors.primary.main }]}>Enable</Text>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderWeekView()}
        {renderSelectedDaySchedules()}
        {renderUpcomingActivities()}
      </ScrollView>

      {/* Schedule Activity Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelScheduleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface.primary }]}>
            {activityToSchedule && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                    Schedule Activity
                  </Text>
                  <TouchableOpacity onPress={handleCancelScheduleModal}>
                    <Text style={[styles.modalClose, { color: colors.text.tertiary }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Activity Preview */}
                <View style={[styles.activityPreview, { backgroundColor: colors.surface.secondary }]}>
                  <Text style={styles.previewEmoji}>{activityToSchedule.emoji}</Text>
                  <Text style={[styles.previewTitle, { color: colors.text.primary }]}>
                    {activityToSchedule.title}
                  </Text>
                </View>

                {/* Date Selection - Show next 7 days */}
                <Text style={[styles.pickerLabel, { color: colors.text.secondary }]}>Select Day</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dateScrollView}
                  contentContainerStyle={styles.dateScrollContent}
                >
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isSelected = scheduleDate.toDateString() === date.toDateString();
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.dateOption,
                          { backgroundColor: isSelected ? colors.primary.main : colors.surface.secondary }
                        ]}
                        onPress={() => handleSelectDate(date)}
                      >
                        <Text style={[
                          styles.dateOptionDay,
                          { color: isSelected ? '#fff' : colors.text.tertiary }
                        ]}>
                          {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                        <Text style={[
                          styles.dateOptionNum,
                          { color: isSelected ? '#fff' : colors.text.primary }
                        ]}>
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Time Selection - Time slots */}
                <Text style={[styles.pickerLabel, { color: colors.text.secondary, marginTop: 16 }]}>Select Time</Text>
                <View style={styles.timeSlotGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.id;
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.timeSlotOption,
                          { backgroundColor: isSelected ? colors.primary.main : colors.surface.secondary }
                        ]}
                        onPress={() => handleSelectTimeSlot(slot.id)}
                      >
                        <Text style={[
                          styles.timeSlotLabel,
                          { color: isSelected ? '#fff' : colors.text.primary }
                        ]}>
                          {slot.label}
                        </Text>
                        <Text style={[
                          styles.timeSlotTime,
                          { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.text.tertiary }
                        ]}>
                          {slot.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <Button
                    variant="outline"
                    onPress={handleCancelScheduleModal}
                    style={styles.modalButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleConfirmSchedule}
                    style={styles.modalButton}
                    disabled={isScheduling}
                  >
                    {isScheduling ? 'Scheduling...' : 'Schedule'}
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  notificationText: {
    flex: 1,
    fontSize: 13,
  },
  enableButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  enableButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  weekContainer: {
    marginBottom: 24,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavText: {
    fontSize: 20,
    fontWeight: '500',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 2,
    borderRadius: 12,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  daySchedules: {
    marginBottom: 24,
  },
  daySchedulesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  scheduleCard: {
    padding: 16,
    marginBottom: 12,
  },
  scheduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 14,
  },
  scheduleNotes: {
    fontSize: 12,
    marginTop: 2,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 32,
  },
  findActivityButton: {
    marginTop: 15,
    marginBottom: 15,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  upcomingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  upcomingEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  upcomingDate: {
    fontSize: 13,
    marginTop: 2,
  },
  upcomingArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  noUpcoming: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  premiumRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  upgradeButton: {
    paddingHorizontal: 32,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 24,
    padding: 4,
  },
  activityPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  previewEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  dateScrollView: {
    marginBottom: 8,
  },
  dateScrollContent: {
    gap: 8,
  },
  dateOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
  },
  dateOptionDay: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateOptionNum: {
    fontSize: 20,
    fontWeight: '700',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  timeSlotOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeSlotTime: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});

export default ScheduleScreen;
