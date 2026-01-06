/**
 * Tests for Custom Activity Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import customActivityService from '../../services/customActivityService';

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
});

describe('customActivityService', () => {
  describe('exports', () => {
    it('should export getCustomActivities', () => {
      expect(typeof customActivityService.getCustomActivities).toBe('function');
    });

    it('should export createCustomActivity', () => {
      expect(typeof customActivityService.createCustomActivity).toBe('function');
    });

    it('should export updateCustomActivity', () => {
      expect(typeof customActivityService.updateCustomActivity).toBe('function');
    });

    it('should export deleteCustomActivity', () => {
      expect(typeof customActivityService.deleteCustomActivity).toBe('function');
    });

    it('should export getCustomActivity', () => {
      expect(typeof customActivityService.getCustomActivity).toBe('function');
    });

    it('should export duplicateActivity', () => {
      expect(typeof customActivityService.duplicateActivity).toBe('function');
    });

    it('should export searchCustomActivities', () => {
      expect(typeof customActivityService.searchCustomActivities).toBe('function');
    });

    it('should export getActivityTemplates', () => {
      expect(typeof customActivityService.getActivityTemplates).toBe('function');
    });

    it('should export MAX_CUSTOM_ACTIVITIES constant', () => {
      expect(customActivityService.MAX_CUSTOM_ACTIVITIES).toBe(50);
    });
  });

  describe('getCustomActivities', () => {
    it('should return empty array for new user', async () => {
      const activities = await customActivityService.getCustomActivities('user-1');

      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBe(0);
    });
  });

  describe('createCustomActivity', () => {
    it('should create a custom activity', async () => {
      const activityData = {
        title: 'My Custom Activity',
        description: 'A fun custom activity',
        category: 'creative',
        emoji: '🎨',
      };

      const result = await customActivityService.createCustomActivity('user-1', activityData);

      expect(result.success).toBe(true);
      expect(result.activity).toBeDefined();
      expect(result.activity.title).toBe('My Custom Activity');
      expect(result.activity.isCustom).toBe(true);
    });

    it('should generate unique ID for activity', async () => {
      const result = await customActivityService.createCustomActivity('user-1', {
        title: 'Test Activity',
      });

      expect(result.activity.id).toBeDefined();
      expect(result.activity.id.startsWith('custom_')).toBe(true);
    });

    it('should fail without title', async () => {
      const result = await customActivityService.createCustomActivity('user-1', {
        description: 'No title',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('title');
    });

    it('should add custom tag to activity', async () => {
      const result = await customActivityService.createCustomActivity('user-1', {
        title: 'Tagged Activity',
        tags: ['fun'],
      });

      expect(result.activity.tags).toContain('custom');
      expect(result.activity.tags).toContain('fun');
    });

    it('should set createdBy to userId', async () => {
      const result = await customActivityService.createCustomActivity('user-123', {
        title: 'Test Activity',
      });

      expect(result.activity.createdBy).toBe('user-123');
    });
  });

  describe('getCustomActivity', () => {
    it('should retrieve a created activity', async () => {
      const createResult = await customActivityService.createCustomActivity('user-1', {
        title: 'Find Me',
      });

      const getResult = await customActivityService.getCustomActivity(
        'user-1',
        createResult.activity.id
      );

      expect(getResult.success).toBe(true);
      expect(getResult.activity.title).toBe('Find Me');
    });

    it('should return error for non-existent activity', async () => {
      const result = await customActivityService.getCustomActivity('user-1', 'non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('updateCustomActivity', () => {
    it('should update an existing activity', async () => {
      const createResult = await customActivityService.createCustomActivity('user-1', {
        title: 'Original Title',
      });

      const updateResult = await customActivityService.updateCustomActivity(
        'user-1',
        createResult.activity.id,
        { title: 'Updated Title' }
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.activity.title).toBe('Updated Title');
    });

    it('should preserve original fields', async () => {
      const createResult = await customActivityService.createCustomActivity('user-1', {
        title: 'Original',
        description: 'Original description',
      });

      const updateResult = await customActivityService.updateCustomActivity(
        'user-1',
        createResult.activity.id,
        { title: 'Updated' }
      );

      expect(updateResult.activity.description).toBe('Original description');
    });

    it('should not allow empty title', async () => {
      const createResult = await customActivityService.createCustomActivity('user-1', {
        title: 'Original',
      });

      const updateResult = await customActivityService.updateCustomActivity(
        'user-1',
        createResult.activity.id,
        { title: '' }
      );

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('empty');
    });

    it('should return error for non-existent activity', async () => {
      const result = await customActivityService.updateCustomActivity(
        'user-1',
        'non-existent-id',
        { title: 'New Title' }
      );

      expect(result.success).toBe(false);
    });
  });

  describe('deleteCustomActivity', () => {
    it('should delete an existing activity', async () => {
      const createResult = await customActivityService.createCustomActivity('user-1', {
        title: 'To Delete',
      });

      const deleteResult = await customActivityService.deleteCustomActivity(
        'user-1',
        createResult.activity.id
      );

      expect(deleteResult.success).toBe(true);

      const activities = await customActivityService.getCustomActivities('user-1');
      expect(activities.length).toBe(0);
    });

    it('should return error for non-existent activity', async () => {
      const result = await customActivityService.deleteCustomActivity('user-1', 'non-existent-id');

      expect(result.success).toBe(false);
    });
  });

  describe('duplicateActivity', () => {
    it('should duplicate an activity with new title', async () => {
      const sourceActivity = {
        title: 'Original Activity',
        description: 'Test description',
        category: 'creative',
        tags: ['fun'],
      };

      const result = await customActivityService.duplicateActivity(
        'user-1',
        sourceActivity,
        'Copied Activity'
      );

      expect(result.success).toBe(true);
      expect(result.activity.title).toBe('Copied Activity');
      expect(result.activity.description).toBe('Test description');
      expect(result.activity.id).not.toBe(sourceActivity.id);
    });

    it('should append (Copy) to title if no new title provided', async () => {
      const result = await customActivityService.duplicateActivity('user-1', {
        title: 'Original',
      });

      expect(result.activity.title).toBe('Original (Copy)');
    });
  });

  describe('searchCustomActivities', () => {
    beforeEach(async () => {
      await customActivityService.createCustomActivity('user-1', {
        title: 'Art Project',
        description: 'Fun with painting',
        category: 'creative',
        tags: ['art', 'messy'],
      });
      await customActivityService.createCustomActivity('user-1', {
        title: 'Soccer Game',
        description: 'Play soccer outdoors',
        category: 'active',
        tags: ['sports'],
      });
    });

    it('should find activities by title', async () => {
      const result = await customActivityService.searchCustomActivities('user-1', 'Art');

      expect(result.success).toBe(true);
      expect(result.activities.length).toBe(1);
      expect(result.activities[0].title).toBe('Art Project');
    });

    it('should find activities by description', async () => {
      const result = await customActivityService.searchCustomActivities('user-1', 'painting');

      expect(result.activities.length).toBe(1);
    });

    it('should find activities by tag', async () => {
      const result = await customActivityService.searchCustomActivities('user-1', 'sports');

      expect(result.activities.length).toBe(1);
    });

    it('should find activities by category', async () => {
      const result = await customActivityService.searchCustomActivities('user-1', 'creative');

      expect(result.activities.length).toBe(1);
    });

    it('should return empty array for no matches', async () => {
      const result = await customActivityService.searchCustomActivities('user-1', 'xyz123');

      expect(result.activities.length).toBe(0);
    });
  });

  describe('getActivityTemplates', () => {
    it('should return array of templates', () => {
      const templates = customActivityService.getActivityTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should have templates with required fields', () => {
      const templates = customActivityService.getActivityTemplates();

      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('title');
        expect(template).toHaveProperty('emoji');
        expect(template).toHaveProperty('category');
      });
    });

    it('should include variety of template types', () => {
      const templates = customActivityService.getActivityTemplates();
      const categories = templates.map(t => t.category);

      expect(categories).toContain('creative');
      expect(categories).toContain('active');
      expect(categories).toContain('educational');
    });
  });

  describe('getCustomActivitiesByCategory', () => {
    beforeEach(async () => {
      await customActivityService.createCustomActivity('user-1', {
        title: 'Creative 1',
        category: 'creative',
      });
      await customActivityService.createCustomActivity('user-1', {
        title: 'Creative 2',
        category: 'creative',
      });
      await customActivityService.createCustomActivity('user-1', {
        title: 'Active 1',
        category: 'active',
      });
    });

    it('should filter by category', async () => {
      const result = await customActivityService.getCustomActivitiesByCategory('user-1', 'creative');

      expect(result.success).toBe(true);
      expect(result.activities.length).toBe(2);
    });

    it('should return empty for category with no activities', async () => {
      const result = await customActivityService.getCustomActivitiesByCategory('user-1', 'music');

      expect(result.activities.length).toBe(0);
    });
  });

  describe('exportCustomActivities', () => {
    it('should export activities with metadata', async () => {
      await customActivityService.createCustomActivity('user-1', {
        title: 'Export Me',
      });

      const result = await customActivityService.exportCustomActivities('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('version');
      expect(result.data).toHaveProperty('exportedAt');
      expect(result.data).toHaveProperty('activities');
      expect(result.data.activities.length).toBe(1);
    });
  });

  describe('importCustomActivities', () => {
    it('should import activities with merge mode', async () => {
      await customActivityService.createCustomActivity('user-1', {
        title: 'Existing',
      });

      const importData = {
        activities: [{ title: 'Imported 1' }, { title: 'Imported 2' }],
      };

      const result = await customActivityService.importCustomActivities('user-1', importData, 'merge');

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);

      const activities = await customActivityService.getCustomActivities('user-1');
      expect(activities.length).toBe(3);
    });

    it('should import activities with replace mode', async () => {
      await customActivityService.createCustomActivity('user-1', {
        title: 'Existing',
      });

      const importData = {
        activities: [{ title: 'Replacement' }],
      };

      const result = await customActivityService.importCustomActivities('user-1', importData, 'replace');

      expect(result.success).toBe(true);

      const activities = await customActivityService.getCustomActivities('user-1');
      expect(activities.length).toBe(1);
      expect(activities[0].title).toBe('Replacement');
    });

    it('should return error for invalid import data', async () => {
      const result = await customActivityService.importCustomActivities('user-1', { invalid: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });
});
