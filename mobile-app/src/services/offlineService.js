/**
 * PlayCompass Offline Service
 *
 * Manages offline data caching and sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamically import NetInfo to handle cases where native module isn't available
let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  console.warn('[OfflineService] @react-native-community/netinfo not available, network detection disabled');
}

const CACHE_PREFIX = '@playcompass_cache_';
const PENDING_ACTIONS_KEY = '@playcompass_pending_actions';
const CACHE_EXPIRY_KEY = '@playcompass_cache_expiry';

// Cache duration in milliseconds
const CACHE_DURATIONS = {
  activities: 24 * 60 * 60 * 1000, // 24 hours
  kids: 7 * 24 * 60 * 60 * 1000, // 7 days
  preferences: 7 * 24 * 60 * 60 * 1000, // 7 days
  history: 24 * 60 * 60 * 1000, // 24 hours
  achievements: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Check if device is online
 */
export const isOnline = async () => {
  if (!NetInfo) {
    // Assume online if NetInfo not available
    return true;
  }

  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return true; // Assume online on error
  }
};

/**
 * Subscribe to network status changes
 */
export const subscribeToNetworkStatus = (callback) => {
  if (!NetInfo) {
    // Return a no-op unsubscribe function if NetInfo not available
    console.warn('[OfflineService] Network status subscription not available');
    return () => {};
  }

  return NetInfo.addEventListener((state) => {
    callback({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });
  });
};

/**
 * Cache data locally
 */
export const cacheData = async (key, data, type = 'activities') => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${CACHE_EXPIRY_KEY}_${key}`;

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));

    // Set expiry time
    const expiryTime = Date.now() + (CACHE_DURATIONS[type] || CACHE_DURATIONS.activities);
    await AsyncStorage.setItem(expiryKey, expiryTime.toString());

    return { success: true };
  } catch (error) {
    console.error('Error caching data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get cached data
 */
export const getCachedData = async (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${CACHE_EXPIRY_KEY}_${key}`;

    // Check expiry
    const expiryTime = await AsyncStorage.getItem(expiryKey);
    if (expiryTime && Date.now() > parseInt(expiryTime, 10)) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(expiryKey);
      return { success: true, data: null, expired: true };
    }

    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached), fromCache: true };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error('Error getting cached data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear specific cache
 */
export const clearCache = async (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${CACHE_EXPIRY_KEY}_${key}`;
    await AsyncStorage.multiRemove([cacheKey, expiryKey]);
    return { success: true };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all caches
 */
export const clearAllCaches = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (k) => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_EXPIRY_KEY)
    );
    await AsyncStorage.multiRemove(cacheKeys);
    return { success: true };
  } catch (error) {
    console.error('Error clearing all caches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Queue an action for later sync (when offline)
 */
export const queueAction = async (action) => {
  try {
    const pending = await getPendingActions();
    pending.push({
      ...action,
      id: Date.now().toString(),
      queuedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
    return { success: true };
  } catch (error) {
    console.error('Error queuing action:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pending actions
 */
export const getPendingActions = async () => {
  try {
    const stored = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
};

/**
 * Remove a pending action
 */
export const removePendingAction = async (actionId) => {
  try {
    const pending = await getPendingActions();
    const filtered = pending.filter((a) => a.id !== actionId);
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error removing pending action:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all pending actions
 */
export const clearPendingActions = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_ACTIONS_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing pending actions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync pending actions when back online
 */
export const syncPendingActions = async (syncHandler) => {
  try {
    const online = await isOnline();
    if (!online) {
      return { success: false, error: 'Still offline' };
    }

    const pending = await getPendingActions();
    if (pending.length === 0) {
      return { success: true, synced: 0 };
    }

    let syncedCount = 0;
    const errors = [];

    for (const action of pending) {
      try {
        const result = await syncHandler(action);
        if (result.success) {
          await removePendingAction(action.id);
          syncedCount++;
        } else {
          errors.push({ action, error: result.error });
        }
      } catch (error) {
        errors.push({ action, error: error.message });
      }
    }

    return {
      success: true,
      synced: syncedCount,
      failed: errors.length,
      errors,
    };
  } catch (error) {
    console.error('Error syncing pending actions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cache activities for offline use
 */
export const cacheActivities = async (userId, activities) => {
  return cacheData(`activities_${userId}`, activities, 'activities');
};

/**
 * Get cached activities
 */
export const getCachedActivities = async (userId) => {
  return getCachedData(`activities_${userId}`);
};

/**
 * Cache kids for offline use
 */
export const cacheKids = async (userId, kids) => {
  return cacheData(`kids_${userId}`, kids, 'kids');
};

/**
 * Get cached kids
 */
export const getCachedKids = async (userId) => {
  return getCachedData(`kids_${userId}`);
};

/**
 * Cache favorites for offline use
 */
export const cacheFavorites = async (userId, favorites) => {
  return cacheData(`favorites_${userId}`, favorites, 'activities');
};

/**
 * Get cached favorites
 */
export const getCachedFavorites = async (userId) => {
  return getCachedData(`favorites_${userId}`);
};

/**
 * Cache history for offline use
 */
export const cacheHistory = async (userId, history) => {
  return cacheData(`history_${userId}`, history, 'history');
};

/**
 * Get cached history
 */
export const getCachedHistory = async (userId) => {
  return getCachedData(`history_${userId}`);
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    const pendingActions = await getPendingActions();

    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }

    return {
      success: true,
      cacheCount: cacheKeys.length,
      pendingActions: pendingActions.length,
      estimatedSize: Math.round(totalSize / 1024), // KB
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download activities for offline use (premium feature)
 */
export const downloadForOffline = async (userId, activities) => {
  try {
    // Cache the activities
    await cacheActivities(userId, activities);

    // Also cache any related data (materials, instructions, etc.)
    const offlineBundle = {
      activities,
      downloadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    await cacheData(`offline_bundle_${userId}`, offlineBundle, 'activities');

    return { success: true, count: activities.length };
  } catch (error) {
    console.error('Error downloading for offline:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if offline bundle is available
 */
export const hasOfflineBundle = async (userId) => {
  try {
    const result = await getCachedData(`offline_bundle_${userId}`);
    if (result.success && result.data) {
      const expiresAt = new Date(result.data.expiresAt);
      if (expiresAt > new Date()) {
        return { available: true, activities: result.data.activities.length };
      }
    }
    return { available: false };
  } catch (error) {
    return { available: false, error: error.message };
  }
};

export default {
  isOnline,
  subscribeToNetworkStatus,
  cacheData,
  getCachedData,
  clearCache,
  clearAllCaches,
  queueAction,
  getPendingActions,
  removePendingAction,
  clearPendingActions,
  syncPendingActions,
  cacheActivities,
  getCachedActivities,
  cacheKids,
  getCachedKids,
  cacheFavorites,
  getCachedFavorites,
  cacheHistory,
  getCachedHistory,
  getCacheStats,
  downloadForOffline,
  hasOfflineBundle,
};
