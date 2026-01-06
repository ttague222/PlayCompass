/**
 * PlayCompass Progress Context
 *
 * Global state for progress tracking and achievements
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import progressService, { ACHIEVEMENTS } from '../services/progressService';
import { useAuth } from './AuthContext';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(null);

  // Load progress data
  const loadProgress = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const [progressData, unlockedData] = await Promise.all([
        progressService.getProgressSummary(),
        progressService.getAchievements(),
      ]);

      setProgress(progressData);
      // Convert ACHIEVEMENTS object to array
      setAchievements(Object.values(ACHIEVEMENTS));
      setUnlockedAchievements(unlockedData || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Load monthly report
  const loadMonthlyReport = useCallback(async (year = null, month = null) => {
    if (!user?.uid) return null;

    try {
      const now = new Date();
      const reportYear = year ?? now.getFullYear();
      const reportMonth = month ?? now.getMonth();
      const report = await progressService.getMonthlyReport(reportYear, reportMonth);
      setMonthlyReport(report);
      return report;
    } catch (error) {
      console.error('Error loading monthly report:', error);
      return null;
    }
  }, [user?.uid]);

  // Record activity completion
  const recordCompletion = useCallback(async (activity, kidCount = 1, rating = null) => {
    if (!user?.uid) return { newAchievements: [] };

    try {
      const result = await progressService.recordActivityCompletion(
        activity,
        kidCount,
        rating
      );

      // Reload progress data
      await loadProgress();

      // If new achievements were earned, show celebration
      if (result.newAchievements && result.newAchievements.length > 0) {
        // Show the first new achievement (queue others if multiple)
        setNewAchievement(result.newAchievements[0]);
      }

      return result;
    } catch (error) {
      console.error('Error recording completion:', error);
      return { newAchievements: [] };
    }
  }, [user?.uid, loadProgress]);

  // Dismiss new achievement celebration
  const dismissAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  // Get achievement by ID
  const getAchievement = useCallback((achievementId) => {
    return achievements.find(a => a.id === achievementId);
  }, [achievements]);

  // Check if achievement is unlocked
  const isAchievementUnlocked = useCallback((achievementId) => {
    return unlockedAchievements.some(a => a.id === achievementId);
  }, [unlockedAchievements]);

  // Get progress percentage for an achievement
  const getAchievementProgress = useCallback((achievement) => {
    if (!progress) return 0;

    switch (achievement.type) {
      case 'milestone':
        return Math.min(100, (progress.totalActivities / achievement.target) * 100);
      case 'streak':
        return Math.min(100, (progress.currentStreak / achievement.target) * 100);
      case 'category':
        const categoryCount = progress.activitiesByCategory?.[achievement.category] || 0;
        return Math.min(100, (categoryCount / achievement.target) * 100);
      default:
        return isAchievementUnlocked(achievement.id) ? 100 : 0;
    }
  }, [progress, isAchievementUnlocked]);

  // Get stats for display
  const getStats = useCallback(() => {
    if (!progress) {
      return {
        totalActivities: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievementsUnlocked: 0,
        totalAchievements: achievements.length,
        favoriteCategory: null,
        activeDays: 0,
      };
    }

    // Find favorite category
    let favoriteCategory = null;
    let maxCount = 0;
    if (progress.activitiesByCategory) {
      Object.entries(progress.activitiesByCategory).forEach(([category, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteCategory = category;
        }
      });
    }

    return {
      totalActivities: progress.totalActivities || 0,
      currentStreak: progress.currentStreak || 0,
      longestStreak: progress.longestStreak || 0,
      achievementsUnlocked: unlockedAchievements.length,
      totalAchievements: achievements.length,
      favoriteCategory,
      activeDays: progress.activeDays || 0,
    };
  }, [progress, achievements.length, unlockedAchievements.length]);

  // Load data on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const value = {
    progress,
    achievements,
    unlockedAchievements,
    newAchievement,
    loading,
    monthlyReport,
    recordCompletion,
    dismissAchievement,
    getAchievement,
    isAchievementUnlocked,
    getAchievementProgress,
    getStats,
    loadProgress,
    loadMonthlyReport,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export default ProgressContext;
