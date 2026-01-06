/**
 * PlayCompass Scheduler Context
 *
 * Global state for activity scheduling and reminders
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getScheduledActivities,
  saveScheduledActivity,
  updateScheduledActivity,
  deleteScheduledActivity,
  getWeeklyPlan,
  addToWeeklyPlan,
  removeFromWeeklyPlan,
  getUpcomingActivities,
  markScheduleCompleted,
  requestNotificationPermissions,
} from '../services/schedulerService';
import { useAuth } from './AuthContext';

const SchedulerContext = createContext();

export const useScheduler = () => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within a SchedulerProvider');
  }
  return context;
};

export const SchedulerProvider = ({ children }) => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load schedules on mount
  useEffect(() => {
    if (user) {
      loadSchedules();
      checkNotificationPermissions();
    }
  }, [user]);

  const checkNotificationPermissions = async () => {
    const result = await requestNotificationPermissions();
    setNotificationsEnabled(result.granted);
    return result;
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const [schedulesData, weeklyPlanData, upcomingData] = await Promise.all([
        getScheduledActivities(),
        getWeeklyPlan(),
        getUpcomingActivities(7),
      ]);

      setSchedules(schedulesData);
      setWeeklyPlan(weeklyPlanData);
      setUpcomingActivities(upcomingData);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleActivity = useCallback(async (activity, scheduledDate, options = {}) => {
    const result = await saveScheduledActivity({
      activity,
      scheduledDate,
      reminderMinutes: options.reminderMinutes || 15,
      recurring: options.recurring || false,
      recurringPattern: options.recurringPattern || null,
      notes: options.notes || '',
      kidIds: options.kidIds || [],
    });

    if (result.success) {
      await loadSchedules();
    }

    return result;
  }, []);

  const updateSchedule = useCallback(async (scheduleId, updates) => {
    const result = await updateScheduledActivity(scheduleId, updates);

    if (result.success) {
      await loadSchedules();
    }

    return result;
  }, []);

  const cancelSchedule = useCallback(async (scheduleId) => {
    const result = await deleteScheduledActivity(scheduleId);

    if (result.success) {
      await loadSchedules();
    }

    return result;
  }, []);

  const completeSchedule = useCallback(async (scheduleId) => {
    const result = await markScheduleCompleted(scheduleId);

    if (result.success) {
      await loadSchedules();
    }

    return result;
  }, []);

  const addActivityToWeeklyPlan = useCallback(async (dayOfWeek, activity, timeSlot) => {
    const result = await addToWeeklyPlan(dayOfWeek, activity, timeSlot);

    if (result.success) {
      const updatedPlan = await getWeeklyPlan();
      setWeeklyPlan(updatedPlan);
    }

    return result;
  }, []);

  const removeActivityFromWeeklyPlan = useCallback(async (dayOfWeek, planItemId) => {
    const result = await removeFromWeeklyPlan(dayOfWeek, planItemId);

    if (result.success) {
      const updatedPlan = await getWeeklyPlan();
      setWeeklyPlan(updatedPlan);
    }

    return result;
  }, []);

  const getSchedulesForDay = useCallback((date) => {
    const targetDate = new Date(date).toDateString();
    return schedules.filter((s) => {
      const scheduleDate = new Date(s.scheduledDate).toDateString();
      return scheduleDate === targetDate;
    });
  }, [schedules]);

  const getTodaySchedules = useCallback(() => {
    return getSchedulesForDay(new Date());
  }, [getSchedulesForDay]);

  const value = {
    // State
    schedules,
    weeklyPlan,
    upcomingActivities,
    loading,
    notificationsEnabled,

    // Actions
    scheduleActivity,
    updateSchedule,
    cancelSchedule,
    completeSchedule,
    addActivityToWeeklyPlan,
    removeActivityFromWeeklyPlan,
    getSchedulesForDay,
    getTodaySchedules,
    refreshSchedules: loadSchedules,
    requestNotifications: checkNotificationPermissions,
  };

  return (
    <SchedulerContext.Provider value={value}>
      {children}
    </SchedulerContext.Provider>
  );
};

export default SchedulerContext;
