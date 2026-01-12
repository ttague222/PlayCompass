/**
 * PlayCompass History Service
 *
 * Handles saving and retrieving activity history
 * Uses backend API for authenticated users, local storage as fallback
 * Respects subscription tier retention limits
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveHistory as saveHistoryApi, getHistory as getHistoryApi } from './apiService';
import { SUBSCRIPTION_TIERS } from './subscriptionService';

const HISTORY_STORAGE_KEY = '@playcompass_history';
const MAX_LOCAL_HISTORY = 500; // Max storage, filtering happens by tier

/**
 * Get history retention days based on subscription tier
 */
export const getRetentionDays = (tier = 'free') => {
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
  return tierConfig.features.historyDays || 7;
};

/**
 * Filter history entries by retention period
 */
export const filterByRetention = (history, tier = 'free') => {
  const retentionDays = getRetentionDays(tier);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  return history.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= cutoffDate;
  });
};

/**
 * Clean up old history entries based on subscription tier
 * Call this periodically or when tier changes
 */
export const cleanupOldHistory = async (tier = 'free') => {
  try {
    const allHistory = await getLocalHistoryUnfiltered();
    const filteredHistory = filterByRetention(allHistory, tier);

    if (filteredHistory.length < allHistory.length) {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
      console.log(
        `[History] Cleaned up ${allHistory.length - filteredHistory.length} old entries`
      );
    }

    return {
      success: true,
      removed: allHistory.length - filteredHistory.length,
      remaining: filteredHistory.length,
    };
  } catch (error) {
    console.error('Error cleaning up history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all local history without retention filtering (for internal use)
 */
const getLocalHistoryUnfiltered = async () => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!historyJson) return [];
    return JSON.parse(historyJson);
  } catch (error) {
    console.error('Error getting local history:', error);
    return [];
  }
};

/**
 * Create a history entry from an activity
 * @param {Object} activity - Activity object
 * @param {boolean} liked - Whether the user liked the activity
 * @param {string} [duration] - Duration of the activity
 * @returns {Object} History entry
 */
export const createHistoryEntry = (activity, liked, duration = null) => ({
  activity_id: activity.id,
  activity_title: activity.title,
  activity_emoji: activity.emoji,
  activity_category: activity.category,
  // Store additional fields for better fallback display
  activity_description: activity.description,
  activity_duration: activity.duration,
  activity_location: activity.location,
  activity_energy: activity.energy,
  activity_ageGroups: activity.ageGroups || activity.age_groups,
  timestamp: new Date().toISOString(),
  liked,
  duration,
  completed: false,
  notes: null,
});

/**
 * Save activity history entries
 * Tries API first, falls back to local storage
 * @param {Array} entries - Array of history entries
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Promise<boolean>} Success status
 */
export const saveHistory = async (entries, isAuthenticated = false) => {
  try {
    // Try API first for authenticated users
    if (isAuthenticated) {
      try {
        await saveHistoryApi(entries);
        console.log('[History] Saved to API successfully');
        // Also save locally as backup
      } catch (apiError) {
        // Silently fall back to local storage only
      }
    }

    // Always save to local storage (as primary or backup)
    const existingHistory = await getLocalHistory();
    const updatedHistory = [...entries, ...existingHistory].slice(0, MAX_LOCAL_HISTORY);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    console.log('[History] Saved to local storage, total entries:', updatedHistory.length);
    return true;
  } catch (error) {
    console.error('[History] Error saving history:', error);
    return false;
  }
};

/**
 * Get activity history
 * Tries API first for authenticated users, falls back to local storage
 * Filters by subscription tier retention period
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {number} [limit] - Maximum entries to retrieve
 * @param {string} [tier] - Subscription tier for retention filtering
 * @returns {Promise<Array>} History entries
 */
export const getHistory = async (isAuthenticated = false, limit = 50, tier = 'free') => {
  try {
    // Try API first for authenticated users
    if (isAuthenticated) {
      try {
        const response = await getHistoryApi(limit);
        if (response.history && response.history.length > 0) {
          console.log('[History] Loaded from API, entries:', response.history.length);
          // Filter by tier retention even for API results
          return filterByRetention(response.history, tier).slice(0, limit);
        }
        // API returned empty, fall back to local
      } catch (apiError) {
        // Silently fall back to local storage - this is expected behavior
        // when backend permissions aren't configured yet
      }
    }

    // Fall back to local storage
    const localHistory = await getLocalHistory(limit, tier);
    console.log('[History] Loaded from local storage, entries:', localHistory.length);
    return localHistory;
  } catch (error) {
    console.error('[History] Error getting history:', error);
    return [];
  }
};

/**
 * Get history from local storage
 * Filters by subscription tier retention period
 * @param {number} [limit] - Maximum entries to retrieve
 * @param {string} [tier] - Subscription tier for retention filtering
 * @returns {Promise<Array>} History entries
 */
export const getLocalHistory = async (limit = MAX_LOCAL_HISTORY, tier = 'free') => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!historyJson) return [];

    const history = JSON.parse(historyJson);
    // Filter by tier retention period
    const filteredHistory = filterByRetention(history, tier);
    return filteredHistory.slice(0, limit);
  } catch (error) {
    console.error('Error getting local history:', error);
    return [];
  }
};

/**
 * Clear local history
 * @returns {Promise<boolean>} Success status
 */
export const clearLocalHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};

/**
 * Mark an activity as completed
 * @param {string} historyId - History entry ID
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Promise<boolean>} Success status
 */
export const markCompleted = async (historyId, isAuthenticated = false) => {
  try {
    // For local storage, update the entry
    const history = await getLocalHistory();
    const updatedHistory = history.map((entry) =>
      entry.id === historyId || entry.activity_id === historyId
        ? { ...entry, completed: true }
        : entry
    );
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.error('Error marking completed:', error);
    return false;
  }
};

/**
 * Get history statistics
 * @param {Array} history - History entries
 * @returns {Object} Statistics
 */
export const getHistoryStats = (history) => {
  const total = history.length;
  const liked = history.filter((h) => h.liked).length;
  const completed = history.filter((h) => h.completed).length;

  // Category breakdown
  const categories = {};
  history.forEach((h) => {
    const cat = h.activity_category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  // Recent activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentCount = history.filter((h) => new Date(h.timestamp) > weekAgo).length;

  return {
    total,
    liked,
    passed: total - liked,
    completed,
    categories,
    recentCount,
    likeRate: total > 0 ? Math.round((liked / total) * 100) : 0,
  };
};

export default {
  createHistoryEntry,
  saveHistory,
  getHistory,
  getLocalHistory,
  clearLocalHistory,
  markCompleted,
  getHistoryStats,
  getRetentionDays,
  filterByRetention,
  cleanupOldHistory,
};
