/**
 * PlayCompass Personalization Context
 *
 * Global state for AI-powered personalization
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import personalizationService from '../services/personalizationService';
import { useAuth } from './AuthContext';

const PersonalizationContext = createContext();

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};

export const PersonalizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  const loadPreferences = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const prefs = await personalizationService.getPreferences(user.uid);
      setPreferences(prefs);

      // Also load insights
      const userInsights = await personalizationService.getInsights(user.uid);
      setInsights(userInsights);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Record activity feedback (rating, completion)
  const recordFeedback = useCallback(
    async (feedback) => {
      if (!user?.uid) return { success: false };

      const result = await personalizationService.recordFeedback(user.uid, feedback);
      if (result.success) {
        // Reload preferences
        const prefs = await personalizationService.getPreferences(user.uid);
        setPreferences(prefs);
      }
      return result;
    },
    [user?.uid]
  );

  // Record swipe behavior
  const recordSwipe = useCallback(
    async (swipeData) => {
      if (!user?.uid) return { success: false };

      const result = await personalizationService.recordSwipe(user.uid, swipeData);
      if (result.success) {
        // Reload preferences
        const prefs = await personalizationService.getPreferences(user.uid);
        setPreferences(prefs);
      }
      return result;
    },
    [user?.uid]
  );

  // Get personalization score for an activity
  const getActivityScore = useCallback(
    (activity, kidId = null) => {
      if (!preferences) return 50;
      return personalizationService.getActivityScore(activity, preferences, kidId);
    },
    [preferences]
  );

  // Rank activities by personalization score
  const rankActivities = useCallback(
    async (activities, kidId = null) => {
      if (!user?.uid) return activities;
      return personalizationService.rankActivities(activities, user.uid, kidId);
    },
    [user?.uid]
  );

  // Get personalized recommendation context
  const getRecommendationContext = useCallback(
    async (kidId) => {
      if (!user?.uid) return null;
      return personalizationService.getPersonalizedRecommendations(user.uid, kidId);
    },
    [user?.uid]
  );

  // Set a preference
  const setPreference = useCallback(
    async (key, value) => {
      if (!user?.uid) return { success: false };

      const result = await personalizationService.setPreference(user.uid, key, value);
      if (result.success) {
        setPreferences((prev) => ({ ...prev, [key]: value }));
      }
      return result;
    },
    [user?.uid]
  );

  // Set kid-specific preference
  const setKidPreference = useCallback(
    async (kidId, key, value) => {
      if (!user?.uid) return { success: false };

      const result = await personalizationService.setKidPreference(user.uid, kidId, key, value);
      if (result.success) {
        setPreferences((prev) => ({
          ...prev,
          kidPreferences: {
            ...prev.kidPreferences,
            [kidId]: {
              ...prev.kidPreferences?.[kidId],
              [key]: value,
            },
          },
        }));
      }
      return result;
    },
    [user?.uid]
  );

  // Refresh insights
  const refreshInsights = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userInsights = await personalizationService.getInsights(user.uid);
      setInsights(userInsights);
      return userInsights;
    } catch (error) {
      console.error('Error refreshing insights:', error);
      return null;
    }
  }, [user?.uid]);

  // Reset personalization
  const resetPersonalization = useCallback(async () => {
    if (!user?.uid) return { success: false };

    const result = await personalizationService.resetPersonalization(user.uid);
    if (result.success) {
      setPreferences(null);
      setInsights(null);
    }
    return result;
  }, [user?.uid]);

  // Load data on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const value = {
    preferences,
    insights,
    loading,
    recordFeedback,
    recordSwipe,
    getActivityScore,
    rankActivities,
    getRecommendationContext,
    setPreference,
    setKidPreference,
    refreshInsights,
    resetPersonalization,
    loadPreferences,
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
};

export default PersonalizationContext;
