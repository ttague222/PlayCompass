/**
 * PlayCompass History Context
 *
 * Global state management for activity history
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getHistory,
  saveHistory,
  createHistoryEntry,
  clearLocalHistory,
  getHistoryStats,
} from '../services/historyService';

const HistoryContext = createContext(null);

export const HistoryProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Load history on mount and when auth changes
  useEffect(() => {
    loadHistory();
  }, [isAuthenticated, user?.uid]);

  /**
   * Load history from storage/API
   */
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const historyData = await getHistory(isAuthenticated, 100);
      setHistory(historyData);
      setStats(getHistoryStats(historyData));
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Add activities to history
   * @param {Array} activities - Activities to add
   * @param {Array} likedIds - IDs of liked activities
   * @param {string} [duration] - Duration setting used
   */
  const addToHistory = useCallback(
    async (activities, likedIds, duration = null) => {
      try {
        // Create history entries for all activities
        const entries = activities.map((activity) =>
          createHistoryEntry(activity, likedIds.includes(activity.id), duration)
        );

        // Save to storage/API
        await saveHistory(entries, isAuthenticated);

        // Update local state
        setHistory((prev) => {
          const updated = [...entries, ...prev].slice(0, 100);
          setStats(getHistoryStats(updated));
          return updated;
        });

        return true;
      } catch (error) {
        console.error('Error adding to history:', error);
        return false;
      }
    },
    [isAuthenticated]
  );

  /**
   * Save a single activity to history
   * @param {Object} activity - Activity object
   * @param {boolean} liked - Whether user liked it
   * @param {string} [duration] - Duration setting
   */
  const saveActivityToHistory = useCallback(
    async (activity, liked, duration = null) => {
      return addToHistory([activity], liked ? [activity.id] : [], duration);
    },
    [addToHistory]
  );

  /**
   * Clear all history
   */
  const clearHistory = useCallback(async () => {
    try {
      await clearLocalHistory();
      setHistory([]);
      setStats(getHistoryStats([]));
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }, []);

  /**
   * Get liked activities from history
   */
  const getLikedActivities = useCallback(() => {
    return history.filter((h) => h.liked);
  }, [history]);

  /**
   * Check if an activity has been seen
   * @param {string} activityId - Activity ID
   */
  const hasSeenActivity = useCallback(
    (activityId) => {
      return history.some((h) => h.activity_id === activityId);
    },
    [history]
  );

  /**
   * Get recent activities (last 7 days)
   */
  const getRecentActivities = useCallback(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return history.filter((h) => new Date(h.timestamp) > weekAgo);
  }, [history]);

  const value = {
    history,
    loading,
    stats,
    loadHistory,
    addToHistory,
    saveActivityToHistory,
    clearHistory,
    getLikedActivities,
    hasSeenActivity,
    getRecentActivities,
    historyCount: history.length,
    hasHistory: history.length > 0,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

export default HistoryContext;
