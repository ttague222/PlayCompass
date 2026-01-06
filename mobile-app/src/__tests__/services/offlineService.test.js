/**
 * Tests for Offline Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import offlineService from '../../services/offlineService';

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
});

describe('offlineService', () => {
  describe('isOnline', () => {
    it('should return true when connected', async () => {
      NetInfo.fetch.mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
      });

      const result = await offlineService.isOnline();

      expect(result).toBe(true);
    });

    it('should return false when disconnected', async () => {
      NetInfo.fetch.mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
      });

      const result = await offlineService.isOnline();

      expect(result).toBe(false);
    });
  });

  describe('cacheData / getCachedData', () => {
    it('should cache and retrieve data', async () => {
      const testData = { items: [1, 2, 3], name: 'test' };

      await offlineService.cacheData('test-key', testData);
      const result = await offlineService.getCachedData('test-key');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.fromCache).toBe(true);
    });

    it('should return null for non-existent cache', async () => {
      const result = await offlineService.getCachedData('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear specific cache', async () => {
      await offlineService.cacheData('test-key', { data: 'test' });
      await offlineService.clearCache('test-key');

      const result = await offlineService.getCachedData('test-key');

      expect(result.data).toBeNull();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all cached data', async () => {
      await offlineService.cacheData('key1', { data: 'test1' });
      await offlineService.cacheData('key2', { data: 'test2' });

      const result = await offlineService.clearAllCaches();

      expect(result.success).toBe(true);

      const cache1 = await offlineService.getCachedData('key1');
      const cache2 = await offlineService.getCachedData('key2');

      expect(cache1.data).toBeNull();
      expect(cache2.data).toBeNull();
    });
  });

  describe('queueAction / getPendingActions', () => {
    it('should queue actions for later sync', async () => {
      const action = {
        type: 'CREATE_ACTIVITY',
        payload: { name: 'Test Activity' },
      };

      await offlineService.queueAction(action);
      const pending = await offlineService.getPendingActions();

      expect(pending.length).toBe(1);
      expect(pending[0].type).toBe('CREATE_ACTIVITY');
      expect(pending[0].id).toBeDefined();
      expect(pending[0].queuedAt).toBeDefined();
    });

    it('should queue multiple actions', async () => {
      await offlineService.queueAction({ type: 'ACTION_1' });
      await offlineService.queueAction({ type: 'ACTION_2' });
      await offlineService.queueAction({ type: 'ACTION_3' });

      const pending = await offlineService.getPendingActions();

      expect(pending.length).toBe(3);
    });
  });

  describe('removePendingAction', () => {
    it('should remove specific action', async () => {
      await offlineService.queueAction({ type: 'ACTION_1' });
      const pending = await offlineService.getPendingActions();
      const actionId = pending[0].id;

      await offlineService.removePendingAction(actionId);
      const remainingPending = await offlineService.getPendingActions();

      expect(remainingPending.length).toBe(0);
    });
  });

  describe('clearPendingActions', () => {
    it('should clear all pending actions', async () => {
      await offlineService.queueAction({ type: 'ACTION_1' });
      await offlineService.queueAction({ type: 'ACTION_2' });

      await offlineService.clearPendingActions();
      const pending = await offlineService.getPendingActions();

      expect(pending.length).toBe(0);
    });
  });

  describe('syncPendingActions', () => {
    it('should sync pending actions when online', async () => {
      NetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });

      await offlineService.queueAction({ type: 'ACTION_1' });
      await offlineService.queueAction({ type: 'ACTION_2' });

      const mockSyncHandler = jest.fn().mockResolvedValue({ success: true });

      const result = await offlineService.syncPendingActions(mockSyncHandler);

      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(mockSyncHandler).toHaveBeenCalledTimes(2);
    });

    it('should not sync when offline', async () => {
      NetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      await offlineService.queueAction({ type: 'ACTION_1' });

      const mockSyncHandler = jest.fn();
      const result = await offlineService.syncPendingActions(mockSyncHandler);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Still offline');
      expect(mockSyncHandler).not.toHaveBeenCalled();
    });

    it('should handle partial sync failures', async () => {
      NetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });

      await offlineService.queueAction({ type: 'SUCCESS' });
      await offlineService.queueAction({ type: 'FAIL' });

      const mockSyncHandler = jest.fn().mockImplementation((action) => {
        if (action.type === 'SUCCESS') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false, error: 'Failed' });
      });

      const result = await offlineService.syncPendingActions(mockSyncHandler);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('cacheActivities / getCachedActivities', () => {
    it('should cache and retrieve activities', async () => {
      const activities = [
        { id: 'act-1', name: 'Activity 1' },
        { id: 'act-2', name: 'Activity 2' },
      ];

      await offlineService.cacheActivities('user-1', activities);
      const result = await offlineService.getCachedActivities('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(activities);
    });
  });

  describe('cacheKids / getCachedKids', () => {
    it('should cache and retrieve kids', async () => {
      const kids = [
        { id: 'kid-1', name: 'Child 1', age: 5 },
        { id: 'kid-2', name: 'Child 2', age: 7 },
      ];

      await offlineService.cacheKids('user-1', kids);
      const result = await offlineService.getCachedKids('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(kids);
    });
  });

  describe('cacheFavorites / getCachedFavorites', () => {
    it('should cache and retrieve favorites', async () => {
      const favorites = [
        { id: 'fav-1', activityId: 'act-1' },
        { id: 'fav-2', activityId: 'act-2' },
      ];

      await offlineService.cacheFavorites('user-1', favorites);
      const result = await offlineService.getCachedFavorites('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(favorites);
    });
  });

  describe('downloadForOffline / hasOfflineBundle', () => {
    it('should download activities for offline use', async () => {
      const activities = [
        { id: 'act-1', name: 'Activity 1' },
        { id: 'act-2', name: 'Activity 2' },
      ];

      const result = await offlineService.downloadForOffline('user-1', activities);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should check for offline bundle availability', async () => {
      const activities = [{ id: 'act-1', name: 'Activity 1' }];
      await offlineService.downloadForOffline('user-1', activities);

      const result = await offlineService.hasOfflineBundle('user-1');

      expect(result.available).toBe(true);
      expect(result.activities).toBe(1);
    });

    it('should return unavailable for non-existent bundle', async () => {
      const result = await offlineService.hasOfflineBundle('user-no-bundle');

      expect(result.available).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      await offlineService.cacheData('key1', { data: 'test1' });
      await offlineService.cacheData('key2', { data: 'test2' });
      await offlineService.queueAction({ type: 'ACTION_1' });

      const stats = await offlineService.getCacheStats();

      expect(stats.success).toBe(true);
      expect(stats.cacheCount).toBeGreaterThanOrEqual(2);
      expect(stats.pendingActions).toBe(1);
      expect(stats.estimatedSize).toBeDefined();
    });
  });

  describe('subscribeToNetworkStatus', () => {
    it('should subscribe to network changes', () => {
      const callback = jest.fn();

      const unsubscribe = offlineService.subscribeToNetworkStatus(callback);

      expect(NetInfo.addEventListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
