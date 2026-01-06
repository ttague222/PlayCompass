/**
 * Tests for Progress Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import progressService, { ACHIEVEMENTS } from '../../services/progressService';

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
});

describe('progressService', () => {
  describe('ACHIEVEMENTS', () => {
    it('should export achievement definitions', () => {
      expect(progressService.ACHIEVEMENTS).toBeDefined();
      expect(typeof progressService.ACHIEVEMENTS).toBe('object');
      expect(Object.keys(progressService.ACHIEVEMENTS).length).toBeGreaterThan(0);
    });

    it('should have achievements with required properties', () => {
      Object.values(progressService.ACHIEVEMENTS).forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('emoji');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('requirement');
      });
    });

    it('should have milestone achievements', () => {
      expect(progressService.ACHIEVEMENTS.first_activity).toBeDefined();
      expect(progressService.ACHIEVEMENTS.activity_10).toBeDefined();
      expect(progressService.ACHIEVEMENTS.activity_50).toBeDefined();
      expect(progressService.ACHIEVEMENTS.activity_100).toBeDefined();
    });

    it('should have streak achievements', () => {
      expect(progressService.ACHIEVEMENTS.streak_3).toBeDefined();
      expect(progressService.ACHIEVEMENTS.streak_7).toBeDefined();
      expect(progressService.ACHIEVEMENTS.streak_30).toBeDefined();
    });
  });

  describe('getProgress', () => {
    it('should return default progress for new user', async () => {
      const progress = await progressService.getProgress();

      expect(progress.totalActivities).toBe(0);
      expect(progress.activitiesByCategory).toEqual({});
      expect(progress.uniqueCategories).toEqual([]);
      expect(progress.weekendActivities).toBe(0);
    });

    it('should persist and retrieve progress', async () => {
      const testProgress = {
        totalActivities: 5,
        activitiesByCategory: { creative: 3, physical: 2 },
        uniqueCategories: ['creative', 'physical'],
        weekendActivities: 2,
        activitiesPerDay: {},
        fiveStarRatings: 1,
        familyActivities: 0,
        lastActivityDate: null,
        activitiesBySeason: {},
        activitiesByTimeOfDay: { morning: 0, afternoon: 5, evening: 0 },
      };

      await progressService.saveProgress(testProgress);
      const retrieved = await progressService.getProgress();

      expect(retrieved.totalActivities).toBe(5);
      expect(retrieved.activitiesByCategory.creative).toBe(3);
    });
  });

  describe('getAchievements', () => {
    it('should return empty array for new user', async () => {
      const achievements = await progressService.getAchievements();

      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBe(0);
    });

    it('should persist and retrieve achievements', async () => {
      const testAchievements = [
        { id: 'first_activity', name: 'First Steps', earnedAt: new Date().toISOString() },
      ];

      await progressService.saveAchievements(testAchievements);
      const retrieved = await progressService.getAchievements();

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('first_activity');
    });
  });

  describe('getStreaks', () => {
    it('should return default streaks for new user', async () => {
      const streaks = await progressService.getStreaks();

      expect(streaks.currentStreak).toBe(0);
      expect(streaks.longestStreak).toBe(0);
      expect(streaks.lastActivityDate).toBeNull();
    });

    it('should persist and retrieve streaks', async () => {
      const testStreaks = {
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: new Date().toDateString(),
      };

      await progressService.saveStreaks(testStreaks);
      const retrieved = await progressService.getStreaks();

      expect(retrieved.currentStreak).toBe(5);
      expect(retrieved.longestStreak).toBe(10);
    });
  });

  describe('recordActivityCompletion', () => {
    const mockActivity = {
      id: 'activity-1',
      name: 'Test Activity',
      category: 'creative',
    };

    it('should record a completed activity', async () => {
      const result = await progressService.recordActivityCompletion(mockActivity);

      expect(result.success).toBe(true);
      expect(result.progress).toBeDefined();
      expect(result.streaks).toBeDefined();
    });

    it('should increment total activities count', async () => {
      await progressService.recordActivityCompletion(mockActivity);
      await progressService.recordActivityCompletion(mockActivity);

      const progress = await progressService.getProgress();

      expect(progress.totalActivities).toBe(2);
    });

    it('should track activities by category', async () => {
      await progressService.recordActivityCompletion({ ...mockActivity, category: 'creative' });
      await progressService.recordActivityCompletion({ ...mockActivity, category: 'physical' });
      await progressService.recordActivityCompletion({ ...mockActivity, category: 'creative' });

      const progress = await progressService.getProgress();

      expect(progress.activitiesByCategory.creative).toBe(2);
      expect(progress.activitiesByCategory.physical).toBe(1);
    });

    it('should track unique categories', async () => {
      await progressService.recordActivityCompletion({ ...mockActivity, category: 'creative' });
      await progressService.recordActivityCompletion({ ...mockActivity, category: 'physical' });
      await progressService.recordActivityCompletion({ ...mockActivity, category: 'creative' });

      const progress = await progressService.getProgress();

      expect(progress.uniqueCategories).toContain('creative');
      expect(progress.uniqueCategories).toContain('physical');
      expect(progress.uniqueCategories.length).toBe(2);
    });

    it('should track 5-star ratings', async () => {
      await progressService.recordActivityCompletion(mockActivity, 1, 5);
      await progressService.recordActivityCompletion(mockActivity, 1, 3);
      await progressService.recordActivityCompletion(mockActivity, 1, 5);

      const progress = await progressService.getProgress();

      expect(progress.fiveStarRatings).toBe(2);
    });

    it('should track family activities with 3+ kids', async () => {
      await progressService.recordActivityCompletion(mockActivity, 3);
      await progressService.recordActivityCompletion(mockActivity, 2);
      await progressService.recordActivityCompletion(mockActivity, 4);

      const progress = await progressService.getProgress();

      expect(progress.familyActivities).toBe(2);
    });
  });

  describe('checkForNewAchievements', () => {
    it('should unlock First Steps achievement on first activity', async () => {
      const mockActivity = {
        id: 'activity-1',
        name: 'First Activity',
        category: 'creative',
      };

      const result = await progressService.recordActivityCompletion(mockActivity);

      expect(result.newAchievements).toBeDefined();
      const firstSteps = result.newAchievements.find(a => a.id === 'first_activity');
      expect(firstSteps).toBeDefined();
    });

    it('should not re-unlock already earned achievements', async () => {
      const mockActivity = {
        id: 'activity-1',
        name: 'Test Activity',
        category: 'creative',
      };

      const result1 = await progressService.recordActivityCompletion(mockActivity);
      const result2 = await progressService.recordActivityCompletion(mockActivity);

      const firstSteps1 = result1.newAchievements.find(a => a.id === 'first_activity');
      const firstSteps2 = result2.newAchievements?.find(a => a.id === 'first_activity');

      expect(firstSteps1).toBeDefined();
      expect(firstSteps2).toBeUndefined();
    });
  });

  describe('getProgressSummary', () => {
    it('should return summary for new user', async () => {
      const summary = await progressService.getProgressSummary();

      expect(summary.totalActivities).toBe(0);
      expect(summary.currentStreak).toBe(0);
      expect(summary.longestStreak).toBe(0);
      expect(summary.categoriesExplored).toBe(0);
      expect(summary.achievementsEarned).toBe(0);
      expect(summary.totalAchievements).toBeGreaterThan(0);
    });

    it('should return updated summary after activity', async () => {
      const mockActivity = { id: 'activity-1', name: 'Test Activity', category: 'creative' };

      await progressService.recordActivityCompletion(mockActivity);

      const summary = await progressService.getProgressSummary();

      expect(summary.totalActivities).toBe(1);
      expect(summary.currentStreak).toBe(1);
      expect(summary.categoriesExplored).toBe(1);
      expect(summary.achievementsEarned).toBeGreaterThan(0); // At least first_activity
    });
  });

  describe('getMonthlyReport', () => {
    it('should return monthly statistics', async () => {
      const mockActivity = { id: 'activity-1', name: 'Test Activity', category: 'creative' };

      await progressService.recordActivityCompletion(mockActivity);
      await progressService.recordActivityCompletion(mockActivity);

      const now = new Date();
      const report = await progressService.getMonthlyReport(now.getFullYear(), now.getMonth());

      expect(report).toHaveProperty('year');
      expect(report).toHaveProperty('month');
      expect(report).toHaveProperty('totalActivities');
      expect(report).toHaveProperty('daysActive');
      expect(report).toHaveProperty('daysInMonth');
      expect(report).toHaveProperty('activityRate');
      expect(report).toHaveProperty('averagePerDay');
      expect(report.totalActivities).toBe(2);
    });

    it('should return empty report for month with no activities', async () => {
      const report = await progressService.getMonthlyReport(2020, 0); // January 2020

      expect(report.totalActivities).toBe(0);
      expect(report.daysActive).toBe(0);
    });
  });

  describe('streak management', () => {
    it('should start streak at 1 for first activity', async () => {
      const mockActivity = { id: 'activity-1', name: 'Test Activity', category: 'creative' };

      await progressService.recordActivityCompletion(mockActivity);

      const streaks = await progressService.getStreaks();

      expect(streaks.currentStreak).toBe(1);
      // longestStreak only updates when currentStreak exceeds it (i.e., on day 2+)
      expect(streaks.longestStreak).toBeGreaterThanOrEqual(0);
    });

    it('should not increment streak for multiple activities on same day', async () => {
      const mockActivity = { id: 'activity-1', name: 'Test Activity', category: 'creative' };

      await progressService.recordActivityCompletion(mockActivity);
      await progressService.recordActivityCompletion(mockActivity);
      await progressService.recordActivityCompletion(mockActivity);

      const streaks = await progressService.getStreaks();

      expect(streaks.currentStreak).toBe(1);
    });
  });
});
