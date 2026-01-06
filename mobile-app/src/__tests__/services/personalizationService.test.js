/**
 * Tests for Personalization Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import personalizationService from '../../services/personalizationService';

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
});

describe('personalizationService', () => {
  describe('getPreferences', () => {
    it('should return default preferences for new user', async () => {
      const prefs = await personalizationService.getPreferences('new-user');

      expect(prefs).toHaveProperty('preferredCategories');
      expect(prefs).toHaveProperty('avoidCategories');
      expect(prefs).toHaveProperty('preferredDurations');
      expect(prefs).toHaveProperty('preferredTimes');
      expect(prefs).toHaveProperty('energyLevel');
      expect(Array.isArray(prefs.preferredCategories)).toBe(true);
    });

    it('should return saved preferences', async () => {
      const customPrefs = {
        preferredCategories: ['creative', 'outdoor'],
        energyLevel: 'high',
      };

      await personalizationService.savePreferences('user-1', customPrefs);
      const prefs = await personalizationService.getPreferences('user-1');

      expect(prefs.preferredCategories).toContain('creative');
      expect(prefs.preferredCategories).toContain('outdoor');
      expect(prefs.energyLevel).toBe('high');
    });
  });

  describe('recordFeedback', () => {
    it('should record activity rating', async () => {
      const feedback = {
        activityId: 'activity-1',
        activityName: 'Fun Activity',
        category: 'creative',
        rating: 5,
        kidId: 'kid-1',
      };

      const result = await personalizationService.recordFeedback('user-1', feedback);

      expect(result.success).toBe(true);

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.ratingHistory.length).toBe(1);
      expect(prefs.ratingHistory[0].rating).toBe(5);
    });

    it('should add high-rated category to preferences', async () => {
      const feedback = {
        activityId: 'activity-1',
        activityName: 'Great Activity',
        category: 'creative',
        rating: 5,
        kidId: 'kid-1',
      };

      await personalizationService.recordFeedback('user-1', feedback);

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.preferredCategories).toContain('creative');
    });

    it('should track kid-specific preferences', async () => {
      const feedback = {
        activityId: 'activity-1',
        activityName: 'Kids Activity',
        category: 'physical',
        rating: 5,
        kidId: 'kid-1',
      };

      await personalizationService.recordFeedback('user-1', feedback);

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.kidPreferences['kid-1']).toBeDefined();
      expect(prefs.kidPreferences['kid-1'].preferredCategories).toContain('physical');
    });
  });

  describe('recordSwipe', () => {
    it('should record swipe history', async () => {
      const swipeData = {
        activityId: 'activity-1',
        activityName: 'Test Activity',
        category: 'creative',
        accepted: true,
        kidId: 'kid-1',
      };

      const result = await personalizationService.recordSwipe('user-1', swipeData);

      expect(result.success).toBe(true);

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.swipeHistory.length).toBe(1);
      expect(prefs.swipeHistory[0].accepted).toBe(true);
    });

    it('should learn from swipe patterns', async () => {
      // Swipe right (accept) on 15 creative activities
      for (let i = 0; i < 15; i++) {
        await personalizationService.recordSwipe('user-1', {
          activityId: `activity-${i}`,
          activityName: `Activity ${i}`,
          category: 'creative',
          accepted: true,
          kidId: 'kid-1',
        });
      }

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.preferredCategories).toContain('creative');
    });

    it('should add to avoid categories after many rejections', async () => {
      // Swipe left (reject) on 15 physical activities
      for (let i = 0; i < 15; i++) {
        await personalizationService.recordSwipe('user-1', {
          activityId: `activity-${i}`,
          activityName: `Activity ${i}`,
          category: 'physical',
          accepted: false,
          kidId: 'kid-1',
        });
      }

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.avoidCategories).toContain('physical');
    });
  });

  describe('getActivityScore', () => {
    it('should return base score for neutral activity', async () => {
      const prefs = await personalizationService.getPreferences('user-1');
      const activity = { id: 'activity-1', category: 'neutral', energyLevel: 'high' };

      const score = personalizationService.getActivityScore(activity, prefs);

      // Base score 50, no energy match with 'high' vs default 'medium'
      expect(score).toBe(50);
    });

    it('should increase score for preferred category', async () => {
      const prefs = {
        preferredCategories: ['creative'],
        avoidCategories: [],
        activityHistory: [],
        ratingHistory: [],
        kidPreferences: {},
        preferredDurations: [],
        preferredLocations: [],
        energyLevel: 'medium',
      };

      const activity = { id: 'activity-1', category: 'creative', energyLevel: 'high' };
      const score = personalizationService.getActivityScore(activity, prefs);

      // Base 50 + preferred bonus 20 = 70
      expect(score).toBe(70);
    });

    it('should decrease score for avoided category', async () => {
      const prefs = {
        preferredCategories: [],
        avoidCategories: ['physical'],
        activityHistory: [],
        ratingHistory: [],
        kidPreferences: {},
        preferredDurations: [],
        preferredLocations: [],
        energyLevel: 'medium',
      };

      const activity = { id: 'activity-1', category: 'physical', energyLevel: 'high' };
      const score = personalizationService.getActivityScore(activity, prefs);

      // Base 50 - avoid penalty 30 = 20
      expect(score).toBe(20);
    });

    it('should decrease score for recently done activity', async () => {
      const prefs = {
        preferredCategories: [],
        avoidCategories: [],
        activityHistory: [{ activityId: 'activity-1' }],
        ratingHistory: [],
        kidPreferences: {},
        preferredDurations: [],
        preferredLocations: [],
        energyLevel: 'medium',
      };

      const activity = { id: 'activity-1', category: 'creative', energyLevel: 'high' };
      const score = personalizationService.getActivityScore(activity, prefs);

      // Base 50 - recent penalty 15 = 35
      expect(score).toBe(35);
    });
  });

  describe('rankActivities', () => {
    it('should rank activities by score', async () => {
      // Set up preferences
      await personalizationService.setPreference('user-1', 'preferredCategories', ['creative']);
      await personalizationService.setPreference('user-1', 'avoidCategories', ['physical']);

      const activities = [
        { id: 'act-1', name: 'Physical Activity', category: 'physical' },
        { id: 'act-2', name: 'Creative Activity', category: 'creative' },
        { id: 'act-3', name: 'Educational Activity', category: 'educational' },
      ];

      const ranked = await personalizationService.rankActivities(activities, 'user-1');

      // Creative should be first (highest score)
      expect(ranked[0].category).toBe('creative');
      // Physical should be last (lowest score)
      expect(ranked[ranked.length - 1].category).toBe('physical');
    });
  });

  describe('setPreference', () => {
    it('should update a specific preference', async () => {
      await personalizationService.setPreference('user-1', 'energyLevel', 'high');

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.energyLevel).toBe('high');
    });
  });

  describe('setKidPreference', () => {
    it('should update kid-specific preference', async () => {
      await personalizationService.setKidPreference(
        'user-1',
        'kid-1',
        'preferredCategories',
        ['outdoor', 'creative']
      );

      const prefs = await personalizationService.getPreferences('user-1');
      expect(prefs.kidPreferences['kid-1'].preferredCategories).toContain('outdoor');
      expect(prefs.kidPreferences['kid-1'].preferredCategories).toContain('creative');
    });
  });

  describe('getInsights', () => {
    it('should indicate not enough data for new user', async () => {
      const insights = await personalizationService.getInsights('new-user');

      expect(insights.hasEnoughData).toBe(false);
    });

    it('should return insights with enough activity data', async () => {
      // Add some activity history
      for (let i = 0; i < 10; i++) {
        await personalizationService.recordFeedback('user-1', {
          activityId: `activity-${i}`,
          activityName: `Activity ${i}`,
          category: i % 2 === 0 ? 'creative' : 'physical',
          rating: 4,
          completed: true,
          duration: 30,
          kidId: 'kid-1',
        });
      }

      const insights = await personalizationService.getInsights('user-1');

      expect(insights.hasEnoughData).toBe(true);
      expect(insights.totalActivities).toBeGreaterThanOrEqual(5);
      expect(insights.topCategories).toBeDefined();
    });
  });

  describe('resetPersonalization', () => {
    it('should successfully reset personalization', async () => {
      // Set some preferences first
      await personalizationService.setPreference('user-1', 'energyLevel', 'high');
      await personalizationService.setPreference('user-1', 'preferredCategories', ['creative']);

      const result = await personalizationService.resetPersonalization('user-1');

      expect(result.success).toBe(true);
    });

    it('should call AsyncStorage removeItem with correct key', async () => {
      // Set some preferences
      await personalizationService.setPreference('reset-user', 'preferredCategories', ['outdoor']);

      // Reset
      await personalizationService.resetPersonalization('reset-user');

      // Verify removeItem was called (the actual implementation removes from storage)
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@playcompass_preferences_reset-user');
    });
  });
});
