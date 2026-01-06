/**
 * PlayCompass AI Personalization Service
 *
 * Learns from user behavior to provide better recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

const PREFERENCES_KEY = '@playcompass_preferences';
const FEEDBACK_KEY = '@playcompass_feedback';

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES = {
  // Activity preferences
  preferredCategories: [],
  avoidCategories: [],
  preferredDurations: [], // 'quick', 'medium', 'long'
  preferredLocations: [], // 'indoor', 'outdoor', 'either'

  // Kid-specific preferences (keyed by kidId)
  kidPreferences: {},

  // Learning data
  activityHistory: [],
  ratingHistory: [],
  swipeHistory: [], // Records swipe left/right

  // Timing preferences
  preferredTimes: {
    morning: false,
    afternoon: false,
    evening: false,
    weekend: false,
  },

  // Special considerations
  specialNeeds: [],
  avoidMaterials: [],
  energyLevel: 'medium', // 'low', 'medium', 'high'

  // Engagement patterns
  lastActivityDate: null,
  averageSessionLength: 0,
  favoriteActivityTypes: [],
};

/**
 * Get user preferences from local storage
 */
export const getPreferences = async (userId) => {
  try {
    const key = `${PREFERENCES_KEY}_${userId}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error getting preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Save user preferences
 */
export const savePreferences = async (userId, preferences) => {
  try {
    const key = `${PREFERENCES_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(preferences));

    // Also sync to Firestore for cross-device
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        preferences: preferences,
        preferencesUpdatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Error saving preferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record activity feedback (rating, completion, etc.)
 */
export const recordFeedback = async (userId, feedback) => {
  try {
    const preferences = await getPreferences(userId);

    // Add to rating history
    if (feedback.rating) {
      preferences.ratingHistory = preferences.ratingHistory || [];
      preferences.ratingHistory.push({
        activityId: feedback.activityId,
        activityName: feedback.activityName,
        category: feedback.category,
        rating: feedback.rating,
        kidId: feedback.kidId,
        timestamp: new Date().toISOString(),
      });

      // Keep last 100 ratings
      if (preferences.ratingHistory.length > 100) {
        preferences.ratingHistory = preferences.ratingHistory.slice(-100);
      }
    }

    // Add to activity history
    if (feedback.completed) {
      preferences.activityHistory = preferences.activityHistory || [];
      preferences.activityHistory.push({
        activityId: feedback.activityId,
        activityName: feedback.activityName,
        category: feedback.category,
        duration: feedback.duration,
        kidId: feedback.kidId,
        timestamp: new Date().toISOString(),
      });

      // Keep last 200 activities
      if (preferences.activityHistory.length > 200) {
        preferences.activityHistory = preferences.activityHistory.slice(-200);
      }
    }

    // Update category preferences based on ratings
    if (feedback.rating >= 4 && feedback.category) {
      if (!preferences.preferredCategories.includes(feedback.category)) {
        preferences.preferredCategories.push(feedback.category);
      }
    } else if (feedback.rating <= 2 && feedback.category) {
      // Low rating might indicate avoid this category
      const lowRatingsInCategory = preferences.ratingHistory.filter(
        (r) => r.category === feedback.category && r.rating <= 2
      ).length;

      if (lowRatingsInCategory >= 3) {
        if (!preferences.avoidCategories.includes(feedback.category)) {
          preferences.avoidCategories.push(feedback.category);
        }
      }
    }

    // Update kid-specific preferences
    if (feedback.kidId) {
      preferences.kidPreferences = preferences.kidPreferences || {};
      preferences.kidPreferences[feedback.kidId] =
        preferences.kidPreferences[feedback.kidId] || {
          preferredCategories: [],
          avoidCategories: [],
          activityCount: 0,
        };

      preferences.kidPreferences[feedback.kidId].activityCount++;

      if (feedback.rating >= 4 && feedback.category) {
        const kidPrefs = preferences.kidPreferences[feedback.kidId];
        if (!kidPrefs.preferredCategories.includes(feedback.category)) {
          kidPrefs.preferredCategories.push(feedback.category);
        }
      }
    }

    await savePreferences(userId, preferences);
    return { success: true };
  } catch (error) {
    console.error('Error recording feedback:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record swipe behavior (accept/reject recommendations)
 */
export const recordSwipe = async (userId, swipeData) => {
  try {
    const preferences = await getPreferences(userId);

    preferences.swipeHistory = preferences.swipeHistory || [];
    preferences.swipeHistory.push({
      activityId: swipeData.activityId,
      activityName: swipeData.activityName,
      category: swipeData.category,
      accepted: swipeData.accepted,
      kidId: swipeData.kidId,
      timestamp: new Date().toISOString(),
    });

    // Keep last 200 swipes
    if (preferences.swipeHistory.length > 200) {
      preferences.swipeHistory = preferences.swipeHistory.slice(-200);
    }

    // Learn from swipe patterns
    if (swipeData.category) {
      const recentSwipes = preferences.swipeHistory.filter(
        (s) => s.category === swipeData.category
      ).slice(-20);

      const acceptRate = recentSwipes.filter((s) => s.accepted).length / recentSwipes.length;

      if (acceptRate >= 0.7 && !preferences.preferredCategories.includes(swipeData.category)) {
        preferences.preferredCategories.push(swipeData.category);
      } else if (acceptRate <= 0.3) {
        if (!preferences.avoidCategories.includes(swipeData.category)) {
          preferences.avoidCategories.push(swipeData.category);
        }
      }
    }

    await savePreferences(userId, preferences);
    return { success: true };
  } catch (error) {
    console.error('Error recording swipe:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update timing preferences based on usage patterns
 */
export const updateTimingPreferences = async (userId) => {
  try {
    const preferences = await getPreferences(userId);
    const history = preferences.activityHistory || [];

    if (history.length < 5) return { success: true }; // Not enough data

    // Analyze activity times
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, weekend: 0 };

    history.forEach((activity) => {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 17) timeSlots.afternoon++;
      else if (hour >= 17 && hour < 21) timeSlots.evening++;

      if (day === 0 || day === 6) timeSlots.weekend++;
    });

    // Update preferences based on patterns
    const total = history.length;
    preferences.preferredTimes = {
      morning: timeSlots.morning / total >= 0.3,
      afternoon: timeSlots.afternoon / total >= 0.3,
      evening: timeSlots.evening / total >= 0.3,
      weekend: timeSlots.weekend / total >= 0.4,
    };

    await savePreferences(userId, preferences);
    return { success: true };
  } catch (error) {
    console.error('Error updating timing preferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get personalization score for an activity
 * Higher score = better match for user
 */
export const getActivityScore = (activity, preferences, kidId = null) => {
  let score = 50; // Base score

  // Category preference bonus
  if (preferences.preferredCategories.includes(activity.category)) {
    score += 20;
  }

  // Category avoidance penalty
  if (preferences.avoidCategories.includes(activity.category)) {
    score -= 30;
  }

  // Kid-specific preferences
  if (kidId && preferences.kidPreferences?.[kidId]) {
    const kidPrefs = preferences.kidPreferences[kidId];
    if (kidPrefs.preferredCategories.includes(activity.category)) {
      score += 15;
    }
    if (kidPrefs.avoidCategories.includes(activity.category)) {
      score -= 20;
    }
  }

  // Check if already done recently (variety bonus for new activities)
  const recentActivities = (preferences.activityHistory || []).slice(-30);
  const doneRecently = recentActivities.some((a) => a.activityId === activity.id);
  if (doneRecently) {
    score -= 15;
  }

  // Rating history for this activity type
  const categoryRatings = (preferences.ratingHistory || [])
    .filter((r) => r.category === activity.category)
    .slice(-10);
  if (categoryRatings.length > 0) {
    const avgRating = categoryRatings.reduce((sum, r) => sum + r.rating, 0) / categoryRatings.length;
    score += (avgRating - 3) * 10; // +/- 20 based on ratings
  }

  // Duration preference
  const activityDuration = activity.duration || 30;
  if (preferences.preferredDurations.includes('quick') && activityDuration <= 15) {
    score += 10;
  } else if (preferences.preferredDurations.includes('long') && activityDuration >= 45) {
    score += 10;
  }

  // Location preference
  if (activity.location === 'outdoor' && preferences.preferredLocations.includes('outdoor')) {
    score += 10;
  } else if (activity.location === 'indoor' && preferences.preferredLocations.includes('indoor')) {
    score += 10;
  }

  // Energy level matching
  const activityEnergy = activity.energyLevel || 'medium';
  if (activityEnergy === preferences.energyLevel) {
    score += 10;
  }

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
};

/**
 * Rank activities by personalization score
 */
export const rankActivities = async (activities, userId, kidId = null) => {
  try {
    const preferences = await getPreferences(userId);

    const scoredActivities = activities.map((activity) => ({
      ...activity,
      personalScore: getActivityScore(activity, preferences, kidId),
    }));

    // Sort by score (highest first)
    scoredActivities.sort((a, b) => b.personalScore - a.personalScore);

    return scoredActivities;
  } catch (error) {
    console.error('Error ranking activities:', error);
    return activities;
  }
};

/**
 * Get personalized recommendations
 */
export const getPersonalizedRecommendations = async (userId, kidId, options = {}) => {
  try {
    const preferences = await getPreferences(userId);

    // Build recommendation context
    const context = {
      preferredCategories: preferences.preferredCategories,
      avoidCategories: preferences.avoidCategories,
      recentActivities: (preferences.activityHistory || []).slice(-20).map((a) => a.activityId),
      highRatedCategories: getHighRatedCategories(preferences),
      timePreferences: preferences.preferredTimes,
      energyLevel: preferences.energyLevel,
      kidPreferences: kidId ? preferences.kidPreferences?.[kidId] : null,
    };

    return {
      success: true,
      context,
      preferences,
    };
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get categories with high ratings
 */
const getHighRatedCategories = (preferences) => {
  const ratings = preferences.ratingHistory || [];
  const categoryRatings = {};

  ratings.forEach((r) => {
    if (!categoryRatings[r.category]) {
      categoryRatings[r.category] = { total: 0, count: 0 };
    }
    categoryRatings[r.category].total += r.rating;
    categoryRatings[r.category].count++;
  });

  return Object.entries(categoryRatings)
    .map(([category, data]) => ({
      category,
      avgRating: data.total / data.count,
    }))
    .filter((c) => c.avgRating >= 4)
    .map((c) => c.category);
};

/**
 * Set preference explicitly
 */
export const setPreference = async (userId, key, value) => {
  try {
    const preferences = await getPreferences(userId);
    preferences[key] = value;
    await savePreferences(userId, preferences);
    return { success: true };
  } catch (error) {
    console.error('Error setting preference:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update kid-specific preferences
 */
export const setKidPreference = async (userId, kidId, key, value) => {
  try {
    const preferences = await getPreferences(userId);
    preferences.kidPreferences = preferences.kidPreferences || {};
    preferences.kidPreferences[kidId] = preferences.kidPreferences[kidId] || {
      preferredCategories: [],
      avoidCategories: [],
      activityCount: 0,
    };
    preferences.kidPreferences[kidId][key] = value;
    await savePreferences(userId, preferences);
    return { success: true };
  } catch (error) {
    console.error('Error setting kid preference:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get insights from user data
 */
export const getInsights = async (userId) => {
  try {
    const preferences = await getPreferences(userId);
    const history = preferences.activityHistory || [];
    const ratings = preferences.ratingHistory || [];

    if (history.length < 5) {
      return {
        hasEnoughData: false,
        message: 'Complete more activities to see personalized insights!',
      };
    }

    // Category distribution
    const categoryCount = {};
    history.forEach((a) => {
      categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    // Average session length trend
    const recentHistory = history.slice(-20);
    const avgDuration = recentHistory.reduce((sum, a) => sum + (a.duration || 0), 0) / recentHistory.length;

    // Activity frequency
    const thisWeek = history.filter((a) => {
      const activityDate = new Date(a.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate > weekAgo;
    }).length;

    // Best rated category
    const categoryRatings = {};
    ratings.forEach((r) => {
      if (!categoryRatings[r.category]) {
        categoryRatings[r.category] = { total: 0, count: 0 };
      }
      categoryRatings[r.category].total += r.rating;
      categoryRatings[r.category].count++;
    });

    let bestCategory = null;
    let bestRating = 0;
    Object.entries(categoryRatings).forEach(([category, data]) => {
      const avg = data.total / data.count;
      if (avg > bestRating && data.count >= 3) {
        bestRating = avg;
        bestCategory = category;
      }
    });

    return {
      hasEnoughData: true,
      totalActivities: history.length,
      topCategories,
      averageDuration: Math.round(avgDuration),
      activitiesThisWeek: thisWeek,
      bestRatedCategory: bestCategory,
      bestRating: Math.round(bestRating * 10) / 10,
      preferredTimes: preferences.preferredTimes,
      energyLevel: preferences.energyLevel,
    };
  } catch (error) {
    console.error('Error getting insights:', error);
    return { hasEnoughData: false, error: error.message };
  }
};

/**
 * Reset all personalization data
 */
export const resetPersonalization = async (userId) => {
  try {
    const key = `${PREFERENCES_KEY}_${userId}`;
    await AsyncStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error('Error resetting personalization:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getPreferences,
  savePreferences,
  recordFeedback,
  recordSwipe,
  updateTimingPreferences,
  getActivityScore,
  rankActivities,
  getPersonalizedRecommendations,
  setPreference,
  setKidPreference,
  getInsights,
  resetPersonalization,
};
