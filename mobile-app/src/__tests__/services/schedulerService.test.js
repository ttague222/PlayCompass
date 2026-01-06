/**
 * Tests for Scheduler Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import schedulerService from '../../services/schedulerService';

// expo-notifications is mocked in jest.setup.js

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
});

describe('schedulerService', () => {
  describe('requestNotificationPermissions', () => {
    it('should request notification permissions', async () => {
      const result = await schedulerService.requestNotificationPermissions();

      expect(result).toHaveProperty('granted');
      expect(result).toHaveProperty('status');
    });
  });

  describe('saveScheduledActivity', () => {
    it('should save a scheduled activity', async () => {
      const schedule = {
        activity: {
          id: 'activity-1',
          title: 'Test Activity',
          emoji: '🎨',
        },
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        reminderMinutes: 15,
      };

      const result = await schedulerService.saveScheduledActivity(schedule);

      expect(result.success).toBe(true);
      expect(result.schedule).toBeDefined();
      expect(result.schedule.id).toBeDefined();
    });

    it('should generate a unique schedule ID', async () => {
      const schedule1 = {
        activity: { id: 'activity-1', title: 'Test Activity' },
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      };
      const schedule2 = {
        activity: { id: 'activity-2', title: 'Test Activity 2' },
        scheduledDate: new Date(Date.now() + 172800000).toISOString(),
      };

      const result1 = await schedulerService.saveScheduledActivity(schedule1);
      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
      const result2 = await schedulerService.saveScheduledActivity(schedule2);

      // IDs should be different (they include timestamp)
      expect(result1.schedule.id).not.toBe(result2.schedule.id);
    });
  });

  describe('getScheduledActivities', () => {
    it('should return empty array when no schedules exist', async () => {
      const schedules = await schedulerService.getScheduledActivities();

      expect(Array.isArray(schedules)).toBe(true);
      expect(schedules.length).toBe(0);
    });

    it('should return saved schedules', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      await schedulerService.saveScheduledActivity({
        activity: { id: 'activity-1', title: 'Test Activity' },
        scheduledDate: futureDate,
      });

      const schedules = await schedulerService.getScheduledActivities();

      expect(schedules.length).toBe(1);
      expect(schedules[0].activity.id).toBe('activity-1');
    });
  });

  describe('updateScheduledActivity', () => {
    it('should update an existing schedule', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const saveResult = await schedulerService.saveScheduledActivity({
        activity: { id: 'activity-1', title: 'Test Activity' },
        scheduledDate: futureDate,
      });

      const newDate = new Date(Date.now() + 172800000).toISOString(); // 2 days
      const updateResult = await schedulerService.updateScheduledActivity(
        saveResult.schedule.id,
        { scheduledDate: newDate }
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.schedule.scheduledDate).toBe(newDate);
    });

    it('should return error for non-existent schedule', async () => {
      const result = await schedulerService.updateScheduledActivity('non-existent', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('deleteScheduledActivity', () => {
    it('should delete an existing schedule', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const saveResult = await schedulerService.saveScheduledActivity({
        activity: { id: 'activity-1', title: 'Test Activity' },
        scheduledDate: futureDate,
      });

      const deleteResult = await schedulerService.deleteScheduledActivity(saveResult.schedule.id);

      expect(deleteResult.success).toBe(true);

      const schedules = await schedulerService.getScheduledActivities();
      expect(schedules.length).toBe(0);
    });
  });

  describe('getUpcomingActivities', () => {
    it('should return activities scheduled for the next N days', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      await schedulerService.saveScheduledActivity({
        activity: { id: 'activity-1', title: 'Test Activity' },
        scheduledDate: futureDate,
      });

      const upcoming = await schedulerService.getUpcomingActivities(7);

      expect(Array.isArray(upcoming)).toBe(true);
      expect(upcoming.length).toBe(1);
    });

    it('should not return past activities', async () => {
      // Save directly to AsyncStorage to simulate past activity
      const pastSchedule = {
        id: 'past-schedule',
        activity: { id: 'activity-1', title: 'Past Activity' },
        scheduledDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };
      await AsyncStorage.setItem('@playcompass_schedules', JSON.stringify([pastSchedule]));

      const upcoming = await schedulerService.getUpcomingActivities(7);

      expect(upcoming.length).toBe(0);
    });
  });

  describe('getWeeklyPlan', () => {
    it('should return default weekly plan structure', async () => {
      const plan = await schedulerService.getWeeklyPlan();

      expect(plan).toBeDefined();
      expect(plan.days).toBeDefined();
      expect(plan.days.monday).toBeDefined();
      expect(plan.days.sunday).toBeDefined();
      expect(Object.keys(plan.days).length).toBe(7);
    });
  });

  describe('addToWeeklyPlan', () => {
    it('should add activity to weekly plan', async () => {
      const activity = { id: 'activity-1', title: 'Test Activity' };

      const result = await schedulerService.addToWeeklyPlan('monday', activity, '9:00 AM');

      expect(result.success).toBe(true);
      expect(result.planItem).toBeDefined();
      expect(result.planItem.activity.id).toBe('activity-1');
    });
  });

  describe('removeFromWeeklyPlan', () => {
    it('should remove activity from weekly plan', async () => {
      const activity = { id: 'activity-1', title: 'Test Activity' };
      const addResult = await schedulerService.addToWeeklyPlan('monday', activity);

      const removeResult = await schedulerService.removeFromWeeklyPlan('monday', addResult.planItem.id);

      expect(removeResult.success).toBe(true);

      const plan = await schedulerService.getWeeklyPlan();
      expect(plan.days.monday.length).toBe(0);
    });
  });

  describe('markScheduleCompleted', () => {
    it('should mark a schedule as completed', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const saveResult = await schedulerService.saveScheduledActivity({
        activity: { id: 'activity-1', title: 'Test Activity' },
        scheduledDate: futureDate,
      });

      const result = await schedulerService.markScheduleCompleted(saveResult.schedule.id);

      expect(result.success).toBe(true);
      expect(result.schedule.completed).toBe(true);
      expect(result.schedule.completedAt).toBeDefined();
    });
  });

  describe('getSchedulesForDate', () => {
    it('should return schedules for a specific date', async () => {
      const tomorrow = new Date(Date.now() + 86400000);
      await schedulerService.saveScheduledActivity({
        activity: { id: 'activity-1', title: 'Test Activity' },
        scheduledDate: tomorrow.toISOString(),
      });

      const schedules = await schedulerService.getSchedulesForDate(tomorrow);

      expect(schedules.length).toBe(1);
    });

    it('should return empty array for dates with no schedules', async () => {
      const schedules = await schedulerService.getSchedulesForDate(new Date());

      expect(schedules.length).toBe(0);
    });
  });
});
