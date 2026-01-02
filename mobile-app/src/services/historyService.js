/**
 * PlayCompass History Service
 *
 * Handles saving and retrieving activity history
 * Uses backend API for authenticated users, local storage as fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveHistory as saveHistoryApi, getHistory as getHistoryApi } from './apiService';

const HISTORY_STORAGE_KEY = '@playcompass_history';
const MAX_LOCAL_HISTORY = 100;

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
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {number} [limit] - Maximum entries to retrieve
 * @returns {Promise<Array>} History entries
 */
export const getHistory = async (isAuthenticated = false, limit = 50) => {
  try {
    // Try API first for authenticated users
    if (isAuthenticated) {
      try {
        const response = await getHistoryApi(limit);
        if (response.history && response.history.length > 0) {
          console.log('[History] Loaded from API, entries:', response.history.length);
          return response.history;
        }
        // API returned empty, fall back to local
      } catch (apiError) {
        // Silently fall back to local storage - this is expected behavior
        // when backend permissions aren't configured yet
      }
    }

    // Fall back to local storage
    const localHistory = await getLocalHistory(limit);
    console.log('[History] Loaded from local storage, entries:', localHistory.length);
    return localHistory;
  } catch (error) {
    console.error('[History] Error getting history:', error);
    return [];
  }
};

/**
 * Get history from local storage
 * @param {number} [limit] - Maximum entries to retrieve
 * @returns {Promise<Array>} History entries
 */
export const getLocalHistory = async (limit = MAX_LOCAL_HISTORY) => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!historyJson) return [];

    const history = JSON.parse(historyJson);
    return history.slice(0, limit);
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
};
