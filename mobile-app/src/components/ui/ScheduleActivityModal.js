/**
 * PlayCompass Schedule Activity Modal
 *
 * Modal for scheduling an activity with date, time, and reminder options
 * Uses simple button-based date/time selection for Expo compatibility
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useScheduler } from '../../context/SchedulerContext';
import Button from './Button';

const REMINDER_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

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

const ScheduleActivityModal = ({ visible, onClose, activity, onScheduled }) => {
  const { colors } = useTheme();
  const { scheduleActivity } = useScheduler();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('morning');
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    if (!activity) return;

    setSaving(true);

    // Combine date and time slot
    const scheduledDate = new Date(selectedDate);
    const slot = TIME_SLOTS.find(s => s.id === selectedTimeSlot);
    scheduledDate.setHours(slot?.hour || 9, slot?.minute || 0, 0, 0);

    const result = await scheduleActivity(activity, scheduledDate.toISOString(), {
      reminderMinutes,
      notes,
    });

    setSaving(false);

    if (result.success) {
      onScheduled?.(activity, scheduledDate);
      onClose(true);
    }
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
  };

  const handleSelectTimeSlot = (slotId) => {
    setSelectedTimeSlot(slotId);
  };

  // Generate next 7 days for date selection
  const getDateOptions = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  const getDateLabel = (date, index) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (!activity) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => onClose(false)}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Schedule Activity</Text>
            <TouchableOpacity onPress={() => onClose(false)} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.text.tertiary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Activity Preview */}
            <View style={[styles.activityPreview, { backgroundColor: colors.surface.secondary }]}>
              <Text style={styles.activityEmoji}>{activity.emoji}</Text>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: colors.text.primary }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityDuration, { color: colors.text.secondary }]}>
                  {activity.duration}
                </Text>
              </View>
            </View>

            {/* Date Selection - Horizontal scrollable days */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>DATE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScrollContent}
              >
                {getDateOptions().map((date, index) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity
                      key={index}
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
                        {getDateLabel(date, index)}
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
            </View>

            {/* Time Selection - Time slot buttons */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>TIME</Text>
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
            </View>

            {/* Reminder Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>REMINDER</Text>
              <View style={styles.reminderOptions}>
                {REMINDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.reminderOption,
                      { backgroundColor: colors.surface.secondary },
                      reminderMinutes === option.value && {
                        backgroundColor: colors.primary.main,
                      },
                    ]}
                    onPress={() => setReminderMinutes(option.value)}
                  >
                    <Text
                      style={[
                        styles.reminderText,
                        { color: reminderMinutes === option.value ? '#fff' : colors.text.secondary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
                NOTES (OPTIONAL)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.surface.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                placeholder="Add any notes..."
                placeholderTextColor={colors.text.tertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border.light }]}>
            <Button
              variant="outline"
              onPress={() => onClose(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              onPress={handleSchedule}
              loading={saving}
              style={styles.scheduleButton}
            >
              Schedule
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  activityPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  activityEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDuration: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dateScrollContent: {
    gap: 8,
    paddingRight: 8,
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
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  reminderText: {
    fontSize: 13,
    fontWeight: '500',
  },
  notesInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  scheduleButton: {
    flex: 1,
  },
});

export default ScheduleActivityModal;
