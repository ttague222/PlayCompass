/**
 * PlayCompass Scheduler Service
 *
 * Manages activity scheduling, reminders, and weekly planning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamically import expo-notifications to handle cases where native module isn't available
let Notifications = null;
try {
  Notifications = require('expo-notifications');
  // Configure notification handler only if module is available
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('[SchedulerService] expo-notifications not available, notification features disabled');
}

const SCHEDULES_KEY = '@playcompass_schedules';
const WEEKLY_PLAN_KEY = '@playcompass_weekly_plan';

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  if (!Notifications) {
    return { granted: false, error: 'Notifications not available. Rebuild the app to enable.' };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { granted: false, status: finalStatus };
    }

    // Configure for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('activity-reminders', {
        name: 'Activity Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7c3aed',
      });
    }

    return { granted: true, status: finalStatus };
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return { granted: false, error: error.message };
  }
};

/**
 * Schedule a notification for an activity
 */
export const scheduleActivityReminder = async (schedule) => {
  if (!Notifications) {
    return { success: false, error: 'Notifications not available' };
  }

  try {
    const { activity, scheduledDate, reminderMinutes = 15 } = schedule;

    // Calculate reminder time
    const reminderDate = new Date(scheduledDate);
    reminderDate.setMinutes(reminderDate.getMinutes() - reminderMinutes);

    // Don't schedule if reminder time is in the past
    if (reminderDate <= new Date()) {
      return { success: false, reason: 'Reminder time is in the past' };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Activity Time: ${activity.title}`,
        body: `${activity.emoji} Get ready! Your scheduled activity starts in ${reminderMinutes} minutes.`,
        data: {
          type: 'activity_reminder',
          activityId: activity.id,
          scheduleId: schedule.id,
        },
        sound: true,
      },
      trigger: {
        date: reminderDate,
        channelId: 'activity-reminders',
      },
    });

    return { success: true, notificationId };
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelActivityReminder = async (notificationId) => {
  if (!Notifications) {
    return { success: false, error: 'Notifications not available' };
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return { success: true };
  } catch (error) {
    console.error('Error canceling reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all scheduled activities (raw, no filtering)
 * Used internally for save operations
 */
const getAllScheduledActivitiesRaw = async () => {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error getting schedules:', error);
    return [];
  }
};

/**
 * Get all scheduled activities
 * Filters out past schedules (but keeps today's schedules)
 */
export const getScheduledActivities = async () => {
  try {
    const schedules = await getAllScheduledActivitiesRaw();
    if (schedules.length > 0) {
      // Filter out past schedules, but keep today's schedules even if time has passed
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const activeSchedules = schedules.filter((s) => {
        const scheduleDate = new Date(s.scheduledDate);
        // Keep if: scheduled for today or later, or recurring, or not completed
        return scheduleDate >= todayStart || s.recurring || !s.completed;
      });
      return activeSchedules;
    }
    return [];
  } catch (error) {
    console.error('Error getting schedules:', error);
    return [];
  }
};

/**
 * Save a scheduled activity
 */
export const saveScheduledActivity = async (schedule) => {
  try {
    // Use raw function to avoid filtering out schedules when saving
    const schedules = await getAllScheduledActivitiesRaw();

    const newSchedule = {
      id: `schedule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      notificationId: null,
      ...schedule,
    };

    // Schedule the reminder notification
    const reminderResult = await scheduleActivityReminder(newSchedule);
    if (reminderResult.success) {
      newSchedule.notificationId = reminderResult.notificationId;
    }

    schedules.push(newSchedule);
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));

    console.log('[SchedulerService] Activity scheduled successfully:', newSchedule.id);
    return { success: true, schedule: newSchedule };
  } catch (error) {
    console.error('[SchedulerService] Error saving schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a scheduled activity
 */
export const updateScheduledActivity = async (scheduleId, updates) => {
  try {
    // Use raw function to avoid losing schedules during update
    const schedules = await getAllScheduledActivitiesRaw();
    const index = schedules.findIndex((s) => s.id === scheduleId);

    if (index === -1) {
      return { success: false, error: 'Schedule not found' };
    }

    const oldSchedule = schedules[index];

    // Cancel old notification if exists
    if (oldSchedule.notificationId) {
      await cancelActivityReminder(oldSchedule.notificationId);
    }

    // Update schedule
    const updatedSchedule = { ...oldSchedule, ...updates, updatedAt: new Date().toISOString() };

    // Reschedule notification if date changed
    if (updates.scheduledDate) {
      const reminderResult = await scheduleActivityReminder(updatedSchedule);
      if (reminderResult.success) {
        updatedSchedule.notificationId = reminderResult.notificationId;
      }
    }

    schedules[index] = updatedSchedule;
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));

    return { success: true, schedule: updatedSchedule };
  } catch (error) {
    console.error('Error updating schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a scheduled activity
 */
export const deleteScheduledActivity = async (scheduleId) => {
  try {
    // Use raw function to avoid losing schedules during delete
    const schedules = await getAllScheduledActivitiesRaw();
    const schedule = schedules.find((s) => s.id === scheduleId);

    if (schedule?.notificationId) {
      await cancelActivityReminder(schedule.notificationId);
    }

    const filtered = schedules.filter((s) => s.id !== scheduleId);
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(filtered));

    return { success: true };
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedules for a specific date
 */
export const getSchedulesForDate = async (date) => {
  try {
    const schedules = await getScheduledActivities();
    const targetDate = new Date(date).toDateString();

    return schedules.filter((s) => {
      const scheduleDate = new Date(s.scheduledDate).toDateString();
      return scheduleDate === targetDate;
    });
  } catch (error) {
    console.error('Error getting schedules for date:', error);
    return [];
  }
};

/**
 * Get weekly plan
 */
export const getWeeklyPlan = async () => {
  try {
    const stored = await AsyncStorage.getItem(WEEKLY_PLAN_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      weekStart: null,
      days: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    };
  } catch (error) {
    console.error('Error getting weekly plan:', error);
    return null;
  }
};

/**
 * Save weekly plan
 */
export const saveWeeklyPlan = async (plan) => {
  try {
    await AsyncStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(plan));
    return { success: true };
  } catch (error) {
    console.error('Error saving weekly plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add activity to weekly plan
 */
export const addToWeeklyPlan = async (dayOfWeek, activity, timeSlot = null) => {
  try {
    const plan = await getWeeklyPlan();

    const planItem = {
      id: `plan_${Date.now()}`,
      activity,
      timeSlot,
      addedAt: new Date().toISOString(),
    };

    plan.days[dayOfWeek.toLowerCase()].push(planItem);
    await saveWeeklyPlan(plan);

    return { success: true, planItem };
  } catch (error) {
    console.error('Error adding to weekly plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove activity from weekly plan
 */
export const removeFromWeeklyPlan = async (dayOfWeek, planItemId) => {
  try {
    const plan = await getWeeklyPlan();
    const day = dayOfWeek.toLowerCase();

    plan.days[day] = plan.days[day].filter((item) => item.id !== planItemId);
    await saveWeeklyPlan(plan);

    return { success: true };
  } catch (error) {
    console.error('Error removing from weekly plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get upcoming scheduled activities (next 7 days)
 */
export const getUpcomingActivities = async (days = 7) => {
  try {
    const schedules = await getScheduledActivities();
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return schedules
      .filter((s) => {
        const scheduleDate = new Date(s.scheduledDate);
        return scheduleDate >= now && scheduleDate <= futureDate;
      })
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  } catch (error) {
    console.error('Error getting upcoming activities:', error);
    return [];
  }
};

/**
 * Mark scheduled activity as completed
 */
export const markScheduleCompleted = async (scheduleId) => {
  try {
    return await updateScheduledActivity(scheduleId, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error marking schedule completed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  requestNotificationPermissions,
  scheduleActivityReminder,
  cancelActivityReminder,
  getScheduledActivities,
  saveScheduledActivity,
  updateScheduledActivity,
  deleteScheduledActivity,
  getSchedulesForDate,
  getWeeklyPlan,
  saveWeeklyPlan,
  addToWeeklyPlan,
  removeFromWeeklyPlan,
  getUpcomingActivities,
  markScheduleCompleted,
};
