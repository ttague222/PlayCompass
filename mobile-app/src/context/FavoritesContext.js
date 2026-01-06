/**
 * PlayCompass Favorites Context
 *
 * Global state management for favorites and ratings
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite as checkIsFavorite,
  toggleFavorite as toggleFavoriteService,
  clearFavorites as clearFavoritesService,
  getRatings,
  getRating,
  saveRating as saveRatingService,
  removeRating,
  getRatingStats,
} from '../services/favoritesService';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [ratingStats, setRatingStats] = useState(null);

  // Load favorites and ratings on mount
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Load all favorites and ratings data
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [favoritesData, ratingsData, statsData] = await Promise.all([
        getFavorites(),
        getRatings(),
        getRatingStats(),
      ]);
      setFavorites(favoritesData);
      setRatings(ratingsData);
      setRatingStats(statsData);
    } catch (error) {
      console.error('[FavoritesContext] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if an activity is favorited
   * @param {string} activityId - Activity ID
   * @returns {boolean} Whether the activity is favorited
   */
  const isFavorite = useCallback(
    (activityId) => {
      return favorites.some((f) => f.id === activityId);
    },
    [favorites]
  );

  /**
   * Toggle favorite status for an activity
   * @param {Object} activity - Activity object
   * @returns {Promise<boolean>} New favorite status
   */
  const toggleFavorite = useCallback(
    async (activity) => {
      const wasFavorited = isFavorite(activity.id);
      const newStatus = await toggleFavoriteService(activity);

      // Update local state
      if (newStatus) {
        // Added to favorites
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
        setFavorites((prev) => [favoriteEntry, ...prev]);
      } else {
        // Removed from favorites
        setFavorites((prev) => prev.filter((f) => f.id !== activity.id));
      }

      return newStatus;
    },
    [isFavorite]
  );

  /**
   * Clear all favorites
   */
  const clearAllFavorites = useCallback(async () => {
    await clearFavoritesService();
    setFavorites([]);
  }, []);

  /**
   * Get rating for a specific activity
   * @param {string} activityId - Activity ID
   * @returns {Object|null} Rating data or null
   */
  const getActivityRating = useCallback(
    (activityId) => {
      return ratings[activityId] || null;
    },
    [ratings]
  );

  /**
   * Save a rating for an activity
   * @param {string} activityId - Activity ID
   * @param {number} stars - Star rating (1-5)
   * @param {string} [feedback] - Optional feedback text
   * @param {Array<string>} [tags] - Optional feedback tags
   */
  const saveRating = useCallback(async (activityId, stars, feedback = '', tags = []) => {
    const success = await saveRatingService(activityId, stars, feedback, tags);
    if (success) {
      setRatings((prev) => ({
        ...prev,
        [activityId]: {
          stars,
          feedback,
          tags,
          ratedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }));
      // Update stats
      const newStats = await getRatingStats();
      setRatingStats(newStats);
    }
    return success;
  }, []);

  /**
   * Remove rating for an activity
   * @param {string} activityId - Activity ID
   */
  const clearRating = useCallback(async (activityId) => {
    await removeRating(activityId);
    setRatings((prev) => {
      const updated = { ...prev };
      delete updated[activityId];
      return updated;
    });
    const newStats = await getRatingStats();
    setRatingStats(newStats);
  }, []);

  const value = {
    // Favorites
    favorites,
    favoritesCount: favorites.length,
    hasFavorites: favorites.length > 0,
    isFavorite,
    toggleFavorite,
    clearAllFavorites,
    // Ratings
    ratings,
    ratingStats,
    getActivityRating,
    saveRating,
    clearRating,
    // General
    loading,
    refreshData: loadData,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
