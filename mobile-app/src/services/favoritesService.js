/**
 * PlayCompass Favorites Service
 *
 * Handles saving and retrieving favorite activities and ratings
 * Uses local storage with optional cloud sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = '@playcompass_favorites';
const RATINGS_STORAGE_KEY = '@playcompass_ratings';

/**
 * Get all favorite activities
 * @returns {Promise<Array>} Array of favorite activity objects
 */
export const getFavorites = async () => {
  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!favoritesJson) return [];
    return JSON.parse(favoritesJson);
  } catch (error) {
    console.error('[Favorites] Error getting favorites:', error);
    return [];
  }
};

/**
 * Add an activity to favorites
 * @param {Object} activity - Activity object to favorite
 * @returns {Promise<boolean>} Success status
 */
export const addFavorite = async (activity) => {
  try {
    const favorites = await getFavorites();

    // Check if already favorited
    if (favorites.some((f) => f.id === activity.id)) {
      return true; // Already favorited
    }

    const favoriteEntry = {
      id: activity.id,
      title: activity.title,
      emoji: activity.emoji,
      category: activity.category,
      description: activity.description,
      duration: activity.duration,
      location: activity.location,
      energy: activity.energy,
      materials: activity.materials,
      ageGroups: activity.ageGroups || activity.age_groups,
      instructions: activity.instructions || [],
      tips: activity.tips || [],
      variations: activity.variations || [],
      tags: activity.tags || [],
      addedAt: new Date().toISOString(),
    };

    const updatedFavorites = [favoriteEntry, ...favorites];
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    console.log('[Favorites] Added to favorites:', activity.title);
    return true;
  } catch (error) {
    console.error('[Favorites] Error adding favorite:', error);
    return false;
  }
};

/**
 * Remove an activity from favorites
 * @param {string} activityId - Activity ID to remove
 * @returns {Promise<boolean>} Success status
 */
export const removeFavorite = async (activityId) => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter((f) => f.id !== activityId);
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    console.log('[Favorites] Removed from favorites:', activityId);
    return true;
  } catch (error) {
    console.error('[Favorites] Error removing favorite:', error);
    return false;
  }
};

/**
 * Check if an activity is favorited
 * @param {string} activityId - Activity ID to check
 * @returns {Promise<boolean>} Whether the activity is favorited
 */
export const isFavorite = async (activityId) => {
  try {
    const favorites = await getFavorites();
    return favorites.some((f) => f.id === activityId);
  } catch (error) {
    console.error('[Favorites] Error checking favorite:', error);
    return false;
  }
};

/**
 * Toggle favorite status for an activity
 * @param {Object} activity - Activity object
 * @returns {Promise<boolean>} New favorite status (true = favorited)
 */
export const toggleFavorite = async (activity) => {
  const currentlyFavorited = await isFavorite(activity.id);
  if (currentlyFavorited) {
    await removeFavorite(activity.id);
    return false;
  } else {
    await addFavorite(activity);
    return true;
  }
};

/**
 * Clear all favorites
 * @returns {Promise<boolean>} Success status
 */
export const clearFavorites = async () => {
  try {
    await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('[Favorites] Error clearing favorites:', error);
    return false;
  }
};

// ============================================
// Ratings
// ============================================

/**
 * Get all activity ratings
 * @returns {Promise<Object>} Map of activityId -> rating data
 */
export const getRatings = async () => {
  try {
    const ratingsJson = await AsyncStorage.getItem(RATINGS_STORAGE_KEY);
    if (!ratingsJson) return {};
    return JSON.parse(ratingsJson);
  } catch (error) {
    console.error('[Ratings] Error getting ratings:', error);
    return {};
  }
};

/**
 * Get rating for a specific activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<Object|null>} Rating data or null
 */
export const getRating = async (activityId) => {
  try {
    const ratings = await getRatings();
    return ratings[activityId] || null;
  } catch (error) {
    console.error('[Ratings] Error getting rating:', error);
    return null;
  }
};

/**
 * Save a rating for an activity
 * @param {string} activityId - Activity ID
 * @param {number} stars - Star rating (1-5)
 * @param {string} [feedback] - Optional feedback text
 * @param {Array<string>} [tags] - Optional feedback tags
 * @returns {Promise<boolean>} Success status
 */
export const saveRating = async (activityId, stars, feedback = '', tags = []) => {
  try {
    const ratings = await getRatings();
    ratings[activityId] = {
      stars,
      feedback,
      tags,
      ratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
    console.log('[Ratings] Saved rating for:', activityId, '- Stars:', stars);
    return true;
  } catch (error) {
    console.error('[Ratings] Error saving rating:', error);
    return false;
  }
};

/**
 * Remove rating for an activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<boolean>} Success status
 */
export const removeRating = async (activityId) => {
  try {
    const ratings = await getRatings();
    delete ratings[activityId];
    await AsyncStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
    return true;
  } catch (error) {
    console.error('[Ratings] Error removing rating:', error);
    return false;
  }
};

/**
 * Get activities with high ratings (4+ stars)
 * @returns {Promise<Array>} Array of activity IDs with high ratings
 */
export const getHighRatedActivityIds = async () => {
  try {
    const ratings = await getRatings();
    return Object.entries(ratings)
      .filter(([_, data]) => data.stars >= 4)
      .map(([id]) => id);
  } catch (error) {
    console.error('[Ratings] Error getting high rated:', error);
    return [];
  }
};

/**
 * Get rating statistics
 * @returns {Promise<Object>} Rating stats
 */
export const getRatingStats = async () => {
  try {
    const ratings = await getRatings();
    const ratingValues = Object.values(ratings);

    if (ratingValues.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;

    ratingValues.forEach((r) => {
      distribution[r.stars] = (distribution[r.stars] || 0) + 1;
      total += r.stars;
    });

    return {
      totalRatings: ratingValues.length,
      averageRating: Math.round((total / ratingValues.length) * 10) / 10,
      distribution,
    };
  } catch (error) {
    console.error('[Ratings] Error getting stats:', error);
    return { totalRatings: 0, averageRating: 0, distribution: {} };
  }
};

export default {
  // Favorites
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  toggleFavorite,
  clearFavorites,
  // Ratings
  getRatings,
  getRating,
  saveRating,
  removeRating,
  getHighRatedActivityIds,
  getRatingStats,
};
