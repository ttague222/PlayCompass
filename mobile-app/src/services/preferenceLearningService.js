/**
 * PlayCompass Preference Learning Service
 *
 * Tracks user preferences from swipe behavior to improve recommendations.
 * Analyzes patterns in liked/passed activities to:
 * - Boost categories they consistently like
 * - Reduce categories they consistently pass on
 * - Build a preference profile over time
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = '@playcompass_preferences';
const MIN_SWIPES_FOR_LEARNING = 3; // Minimum swipes in a category before we trust the pattern
const DECAY_FACTOR = 0.95; // Older preferences decay slightly over time
const STRONG_PREFERENCE_THRESHOLD = 0.7; // 70%+ like rate = strong preference
const STRONG_DISLIKE_THRESHOLD = 0.3; // 30%- like rate = strong dislike

/**
 * Default preferences structure
 */
const getDefaultPreferences = () => ({
  categories: {
    // Each category tracks: { liked: 0, passed: 0, lastUpdated: null }
  },
  activityFeedback: {
    // activityId: { liked: boolean, count: number, lastSeen: timestamp }
  },
  insights: {
    lastAnalyzed: null,
    topCategories: [],
    avoidCategories: [],
    totalSwipes: 0,
  },
  version: 1,
});

/**
 * Load preferences from storage
 */
export const loadPreferences = async () => {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return getDefaultPreferences();
  } catch (error) {
    console.error('[PreferenceLearning] Error loading preferences:', error);
    return getDefaultPreferences();
  }
};

/**
 * Save preferences to storage
 */
export const savePreferences = async (preferences) => {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('[PreferenceLearning] Error saving preferences:', error);
  }
};

/**
 * Record a swipe action (like or pass)
 * @param {Object} activity - The activity that was swiped on
 * @param {boolean} liked - Whether the user liked the activity
 */
export const recordSwipe = async (activity, liked) => {
  const preferences = await loadPreferences();
  const category = activity.category?.toLowerCase();
  const activityId = activity.id;
  const now = new Date().toISOString();

  // Update category stats
  if (category) {
    if (!preferences.categories[category]) {
      preferences.categories[category] = { liked: 0, passed: 0, lastUpdated: null };
    }

    if (liked) {
      preferences.categories[category].liked += 1;
    } else {
      preferences.categories[category].passed += 1;
    }
    preferences.categories[category].lastUpdated = now;
  }

  // Track individual activity feedback (for "never show again" feature)
  if (activityId) {
    if (!preferences.activityFeedback[activityId]) {
      preferences.activityFeedback[activityId] = { liked: false, count: 0, lastSeen: null };
    }
    preferences.activityFeedback[activityId] = {
      liked,
      count: preferences.activityFeedback[activityId].count + 1,
      lastSeen: now,
    };
  }

  // Update total swipes
  preferences.insights.totalSwipes += 1;

  // Re-analyze insights periodically (every 5 swipes)
  if (preferences.insights.totalSwipes % 5 === 0) {
    analyzeInsights(preferences);
  }

  await savePreferences(preferences);
  return preferences;
};

/**
 * Analyze preferences and generate insights
 */
const analyzeInsights = (preferences) => {
  const categoryScores = [];

  for (const [category, stats] of Object.entries(preferences.categories)) {
    const total = stats.liked + stats.passed;
    if (total >= MIN_SWIPES_FOR_LEARNING) {
      const likeRate = stats.liked / total;
      categoryScores.push({
        category,
        likeRate,
        total,
        liked: stats.liked,
        passed: stats.passed,
      });
    }
  }

  // Sort by like rate
  categoryScores.sort((a, b) => b.likeRate - a.likeRate);

  // Identify top and avoid categories
  preferences.insights.topCategories = categoryScores
    .filter(c => c.likeRate >= STRONG_PREFERENCE_THRESHOLD)
    .map(c => c.category);

  preferences.insights.avoidCategories = categoryScores
    .filter(c => c.likeRate <= STRONG_DISLIKE_THRESHOLD)
    .map(c => c.category);

  preferences.insights.lastAnalyzed = new Date().toISOString();

  return preferences.insights;
};

/**
 * Get category preference scores for recommendation boosting
 * Returns a map of category -> score (-1 to 1)
 * Positive = boost this category, Negative = reduce this category
 */
export const getCategoryBoosts = async () => {
  const preferences = await loadPreferences();
  const boosts = {};

  for (const [category, stats] of Object.entries(preferences.categories)) {
    const total = stats.liked + stats.passed;
    if (total >= MIN_SWIPES_FOR_LEARNING) {
      // Calculate boost: ranges from -1 (always passed) to +1 (always liked)
      // Neutral (50% like rate) = 0
      const likeRate = stats.liked / total;
      boosts[category] = (likeRate - 0.5) * 2; // Normalize to -1 to 1
    }
  }

  return boosts;
};

/**
 * Get activities that should be excluded (passed multiple times)
 * @param {number} minPasses - Minimum pass count to exclude (default 2)
 */
export const getExcludedActivityIds = async (minPasses = 2) => {
  const preferences = await loadPreferences();
  const excluded = [];

  for (const [activityId, feedback] of Object.entries(preferences.activityFeedback)) {
    // Exclude if passed multiple times
    if (!feedback.liked && feedback.count >= minPasses) {
      excluded.push(activityId);
    }
  }

  return excluded;
};

/**
 * Get recently seen activity IDs (within the last N days)
 * @param {number} days - Number of days to look back (default 1)
 */
export const getRecentlySeenActivityIds = async (days = 1) => {
  const preferences = await loadPreferences();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = [];

  for (const [activityId, feedback] of Object.entries(preferences.activityFeedback)) {
    if (feedback.lastSeen && new Date(feedback.lastSeen) > cutoff) {
      recent.push(activityId);
    }
  }

  return recent;
};

/**
 * Get learning insights for display to user
 */
export const getLearningInsights = async () => {
  const preferences = await loadPreferences();
  const insights = {
    totalSwipes: preferences.insights.totalSwipes,
    isLearning: preferences.insights.totalSwipes >= MIN_SWIPES_FOR_LEARNING,
    topCategories: [],
    avoidCategories: [],
    categoryBreakdown: [],
  };

  // Build detailed category breakdown
  for (const [category, stats] of Object.entries(preferences.categories)) {
    const total = stats.liked + stats.passed;
    if (total > 0) {
      const likeRate = Math.round((stats.liked / total) * 100);
      insights.categoryBreakdown.push({
        category,
        liked: stats.liked,
        passed: stats.passed,
        total,
        likeRate,
      });
    }
  }

  // Sort by total interactions
  insights.categoryBreakdown.sort((a, b) => b.total - a.total);

  // Get top and avoid categories
  insights.topCategories = preferences.insights.topCategories || [];
  insights.avoidCategories = preferences.insights.avoidCategories || [];

  return insights;
};

/**
 * Generate a personalized message based on learning
 * @param {string} kidName - Name of the kid for personalization
 */
export const getLearningMessage = async (kidName) => {
  const insights = await getLearningInsights();

  if (!insights.isLearning) {
    const remaining = MIN_SWIPES_FOR_LEARNING - insights.totalSwipes;
    return null; // Not enough data yet
  }

  if (insights.topCategories.length > 0) {
    const topCategory = insights.topCategories[0];
    const messages = [
      `We noticed ${kidName} loves ${topCategory} activities!`,
      `${kidName} seems to really enjoy ${topCategory} activities`,
      `We're showing more ${topCategory} activities based on your likes`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  return null;
};

/**
 * Clear all learned preferences (for testing or user request)
 */
export const clearPreferences = async () => {
  try {
    await AsyncStorage.removeItem(PREFERENCES_KEY);
    return { success: true };
  } catch (error) {
    console.error('[PreferenceLearning] Error clearing preferences:', error);
    return { success: false, error: error.message };
  }
};

export default {
  loadPreferences,
  savePreferences,
  recordSwipe,
  getCategoryBoosts,
  getExcludedActivityIds,
  getRecentlySeenActivityIds,
  getLearningInsights,
  getLearningMessage,
  clearPreferences,
};
