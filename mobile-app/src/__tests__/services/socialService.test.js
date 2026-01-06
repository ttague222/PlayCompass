/**
 * Tests for Social Service
 *
 * Note: The socialService relies on react-native Share and expo-linking.
 * These are mocked at the jest.mock level before import.
 */

// Mock react-native Share before importing
jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
}), { virtual: true });

// Mock expo-linking
jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Import after mocks are set up
const socialService = require('../../services/socialService').default;
const { Share } = require('react-native');
const Linking = require('expo-linking');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('socialService', () => {
  describe('shareActivity', () => {
    const mockActivity = {
      id: 'activity-1',
      name: 'Fun Arts & Crafts',
      description: 'Create beautiful artwork with simple materials',
      category: 'creative',
      duration: 30,
      ageRange: '3-8 years',
    };

    it('should share activity via native share', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      const result = await socialService.shareActivity(mockActivity);

      expect(result.success).toBe(true);
      expect(result.shared).toBe(true);
      expect(Share.share).toHaveBeenCalled();
    });

    it('should include activity name in share message', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareActivity(mockActivity);

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('Fun Arts & Crafts');
    });

    it('should handle dismissed share', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.dismissedAction });

      const result = await socialService.shareActivity(mockActivity);

      expect(result.success).toBe(true);
      expect(result.shared).toBe(false);
      expect(result.dismissed).toBe(true);
    });

    it('should include emoji when option is true', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareActivity(mockActivity, { includeEmoji: true });

      const shareCall = Share.share.mock.calls[0][0];
      // Check for any emoji (creative should have palette emoji)
      expect(shareCall.message).toMatch(/[\u{1F3A8}]/u);
    });
  });

  describe('shareToplatform', () => {
    const mockActivity = {
      id: 'activity-1',
      name: 'Test Activity',
      category: 'creative',
    };

    it('should open WhatsApp with share message', async () => {
      Linking.canOpenURL.mockResolvedValueOnce(true);
      Linking.openURL.mockResolvedValueOnce();

      const result = await socialService.shareToplatform(mockActivity, 'whatsapp');

      expect(result.success).toBe(true);
      expect(result.platform).toBe('whatsapp');
      expect(Linking.openURL).toHaveBeenCalled();
    });

    it('should open Twitter with share message', async () => {
      Linking.canOpenURL.mockResolvedValueOnce(true);
      Linking.openURL.mockResolvedValueOnce();

      const result = await socialService.shareToplatform(mockActivity, 'twitter');

      expect(Linking.openURL).toHaveBeenCalled();
      const url = Linking.openURL.mock.calls[0][0];
      expect(url).toContain('twitter.com/intent/tweet');
    });

    it('should open Facebook with share message', async () => {
      Linking.canOpenURL.mockResolvedValueOnce(true);
      Linking.openURL.mockResolvedValueOnce();

      const result = await socialService.shareToplatform(mockActivity, 'facebook');

      const url = Linking.openURL.mock.calls[0][0];
      expect(url).toContain('facebook.com/sharer');
    });

    it('should open Telegram with share message', async () => {
      Linking.canOpenURL.mockResolvedValueOnce(true);
      Linking.openURL.mockResolvedValueOnce();

      const result = await socialService.shareToplatform(mockActivity, 'telegram');

      const url = Linking.openURL.mock.calls[0][0];
      expect(url).toContain('t.me/share');
    });

    it('should fall back to native share when platform not available', async () => {
      Linking.canOpenURL.mockResolvedValueOnce(false);
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareToplatform(mockActivity, 'whatsapp');

      expect(Share.share).toHaveBeenCalled();
    });
  });

  describe('shareCompletedActivity', () => {
    const mockActivity = {
      id: 'activity-1',
      name: 'Completed Activity',
      description: 'We did it!',
      category: 'physical',
    };

    it('should share completed activity', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      const result = await socialService.shareCompletedActivity(mockActivity);

      expect(result.success).toBe(true);
    });

    it('should include kid name when provided', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareCompletedActivity(mockActivity, null, 'Emma');

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('Emma');
    });

    it('should use generic message when no kid name', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareCompletedActivity(mockActivity);

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('We just completed');
    });
  });

  describe('shareActivityList', () => {
    const mockActivities = [
      { id: 'act-1', name: 'Activity 1', category: 'creative', duration: 15 },
      { id: 'act-2', name: 'Activity 2', category: 'physical', duration: 30 },
      { id: 'act-3', name: 'Activity 3', category: 'educational' },
    ];

    it('should share activity list', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      const result = await socialService.shareActivityList(mockActivities, 'My Fun Activities');

      expect(result.success).toBe(true);
    });

    it('should include list name in message', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareActivityList(mockActivities, 'Weekend Plans');

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('Weekend Plans');
    });

    it('should include activity names', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareActivityList(mockActivities);

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('Activity 1');
      expect(shareCall.message).toContain('Activity 2');
    });

    it('should truncate at 5 activities', async () => {
      const manyActivities = Array.from({ length: 10 }, (_, i) => ({
        id: `act-${i}`,
        name: `Activity ${i}`,
        category: 'creative',
      }));

      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareActivityList(manyActivities);

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('5 more');
    });
  });

  describe('shareAchievement', () => {
    const mockAchievement = {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first activity',
      icon: '🎯',
    };

    it('should share achievement', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      const result = await socialService.shareAchievement(mockAchievement);

      expect(result.success).toBe(true);
    });

    it('should include achievement details', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareAchievement(mockAchievement);

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('Achievement Unlocked');
      expect(shareCall.message).toContain('First Steps');
      expect(shareCall.message).toContain('🎯');
    });
  });

  describe('shareWeeklySummary', () => {
    const mockSummary = {
      activitiesCompleted: 15,
      totalMinutes: 450,
      streak: 7,
      favoriteCategory: 'creative',
      newAchievements: 3,
    };

    it('should share weekly summary', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      const result = await socialService.shareWeeklySummary(mockSummary);

      expect(result.success).toBe(true);
    });

    it('should include summary statistics', async () => {
      Share.share.mockResolvedValueOnce({ action: Share.sharedAction });

      await socialService.shareWeeklySummary(mockSummary);

      const shareCall = Share.share.mock.calls[0][0];
      expect(shareCall.message).toContain('15');
      expect(shareCall.message).toContain('450 minutes');
      expect(shareCall.message).toContain('7 days');
      expect(shareCall.message).toContain('creative');
      expect(shareCall.message).toContain('3');
    });
  });

  describe('SHARE_PLATFORMS', () => {
    it('should export available share platforms', () => {
      expect(socialService.SHARE_PLATFORMS).toBeDefined();
      expect(Array.isArray(socialService.SHARE_PLATFORMS)).toBe(true);
      expect(socialService.SHARE_PLATFORMS.length).toBeGreaterThan(0);
    });

    it('should have platform objects with required properties', () => {
      socialService.SHARE_PLATFORMS.forEach(platform => {
        expect(platform).toHaveProperty('id');
        expect(platform).toHaveProperty('name');
        expect(platform).toHaveProperty('icon');
      });
    });
  });
});
