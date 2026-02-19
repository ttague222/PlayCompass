/**
 * PlayCompass Activities Service
 *
 * Functions for filtering, querying, and retrieving activities
 */

import { activities } from '../data/activities';
import {
  AGE_GROUPS,
  CATEGORIES,
  DURATIONS,
  LOCATIONS,
  ENERGY_LEVELS,
} from '../data/activitySchema';

/**
 * Get age group ID from a child's age
 * @param {number} age - Child's age in years
 * @returns {string} Age group ID
 */
export const getAgeGroupFromAge = (age) => {
  for (const [key, group] of Object.entries(AGE_GROUPS)) {
    if (age >= group.min && age <= group.max) {
      return group.id;
    }
  }
  return 'late_elementary'; // Default fallback
};

/**
 * Get all unique age groups from multiple children
 * @param {Array<{age: number}>} kids - Array of kids with age property
 * @returns {string[]} Array of unique age group IDs
 */
export const getAgeGroupsFromKids = (kids) => {
  const ageGroups = new Set();
  kids.forEach((kid) => {
    ageGroups.add(getAgeGroupFromAge(kid.age));
  });
  return Array.from(ageGroups);
};

/**
 * Get all unique interests from multiple children
 * @param {Array<{interests: string[]}>} kids - Array of kids with interests
 * @returns {string[]} Array of unique interests
 */
export const getInterestsFromKids = (kids) => {
  const interests = new Set();
  kids.forEach((kid) => {
    kid.interests?.forEach((interest) => interests.add(interest));
  });
  return Array.from(interests);
};

/**
 * Filter activities by age group
 * @param {string} ageGroupId - Age group ID to filter by
 * @returns {Activity[]} Filtered activities
 */
export const filterByAgeGroup = (ageGroupId) => {
  return activities.filter((activity) =>
    activity.ageGroups.includes(ageGroupId)
  );
};

/**
 * Filter activities by multiple age groups (for multiple kids)
 * Activities that work for ANY of the specified age groups
 * This allows multi-kid families with different ages to get more results
 * @param {string[]} ageGroupIds - Array of age group IDs
 * @returns {Activity[]} Filtered activities
 */
export const filterByAgeGroups = (ageGroupIds) => {
  if (!ageGroupIds || ageGroupIds.length === 0) return activities;

  return activities.filter((activity) =>
    ageGroupIds.some((ageGroup) => activity.ageGroups.includes(ageGroup))
  );
};

/**
 * Filter activities by category
 * @param {string} categoryId - Category ID to filter by
 * @returns {Activity[]} Filtered activities
 */
export const filterByCategory = (categoryId) => {
  return activities.filter((activity) => activity.category === categoryId);
};

/**
 * Filter activities by location
 * @param {string} locationId - Location ID (indoor/outdoor/both)
 * @returns {Activity[]} Filtered activities
 */
export const filterByLocation = (locationId) => {
  if (locationId === 'both') return activities;

  return activities.filter(
    (activity) =>
      activity.location === locationId || activity.location === 'both'
  );
};

/**
 * Filter activities by duration
 * @param {string} durationId - Duration ID to filter by
 * @returns {Activity[]} Filtered activities
 */
export const filterByDuration = (durationId) => {
  return activities.filter((activity) => activity.duration === durationId);
};

/**
 * Filter activities by available time (in minutes)
 * @param {number} minutes - Available time in minutes
 * @returns {Activity[]} Activities that fit within the time
 */
export const filterByAvailableTime = (minutes) => {
  const validDurations = [];

  for (const [key, duration] of Object.entries(DURATIONS)) {
    if (duration.min <= minutes) {
      validDurations.push(duration.id);
    }
  }

  return activities.filter((activity) =>
    validDurations.includes(activity.duration)
  );
};

/**
 * Filter activities by energy level
 * @param {string} energyId - Energy level ID
 * @returns {Activity[]} Filtered activities
 */
export const filterByEnergy = (energyId) => {
  return activities.filter((activity) => activity.energy === energyId);
};

/**
 * Filter activities by interests
 * Activities that match ANY of the provided interests
 * @param {string[]} interests - Array of interest IDs
 * @returns {Activity[]} Filtered activities
 */
export const filterByInterests = (interests) => {
  if (!interests || interests.length === 0) return activities;

  return activities.filter((activity) =>
    activity.interests.some((interest) => interests.includes(interest))
  );
};

/**
 * Search activities by text query
 * Searches title, description, and tags
 * @param {string} query - Search query
 * @returns {Activity[]} Matching activities
 */
export const searchActivities = (query) => {
  if (!query || query.trim() === '') return activities;

  const lowerQuery = query.toLowerCase().trim();

  return activities.filter(
    (activity) =>
      activity.title.toLowerCase().includes(lowerQuery) ||
      activity.description.toLowerCase().includes(lowerQuery) ||
      activity.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Get activity by ID
 * @param {string} id - Activity ID
 * @returns {Activity|undefined} Activity or undefined
 */
export const getActivityById = (id) => {
  return activities.find((activity) => activity.id === id);
};

/**
 * Get random activities
 * @param {number} count - Number of activities to return
 * @param {Activity[]} [sourceActivities] - Optional source array (defaults to all)
 * @returns {Activity[]} Random activities
 */
export const getRandomActivities = (count, sourceActivities = activities) => {
  const shuffled = [...sourceActivities].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Get activities sorted by popularity
 * @param {Activity[]} [sourceActivities] - Optional source array (defaults to all)
 * @param {boolean} [ascending=false] - Sort ascending (default: descending)
 * @returns {Activity[]} Sorted activities
 */
export const sortByPopularity = (sourceActivities = activities, ascending = false) => {
  return [...sourceActivities].sort((a, b) =>
    ascending
      ? a.popularityScore - b.popularityScore
      : b.popularityScore - a.popularityScore
  );
};

/**
 * Get activities grouped by category
 * @param {Activity[]} [sourceActivities] - Optional source array (defaults to all)
 * @returns {Object} Activities grouped by category ID
 */
export const groupByCategory = (sourceActivities = activities) => {
  const grouped = {};

  sourceActivities.forEach((activity) => {
    if (!grouped[activity.category]) {
      grouped[activity.category] = [];
    }
    grouped[activity.category].push(activity);
  });

  return grouped;
};

/**
 * Get category info with count
 * @returns {Array} Categories with activity counts
 */
export const getCategoriesWithCounts = () => {
  const grouped = groupByCategory();

  return Object.entries(CATEGORIES).map(([key, category]) => ({
    ...category,
    count: grouped[category.id]?.length || 0,
  }));
};

/**
 * Advanced filter with multiple criteria
 * @param {Object} filters - Filter criteria
 * @param {string[]} [filters.ageGroups] - Age group IDs
 * @param {string} [filters.category] - Category ID
 * @param {string} [filters.location] - Location ID
 * @param {string} [filters.duration] - Duration ID
 * @param {number} [filters.availableTime] - Available time in minutes
 * @param {string} [filters.energy] - Energy level ID
 * @param {string[]} [filters.interests] - Interest IDs
 * @param {string} [filters.search] - Search query
 * @param {boolean} [filters.requiresNoSupplies] - Only activities with no materials
 * @param {string} [filters.materials] - Materials filter (none, basic, or null for any)
 * @returns {Activity[]} Filtered activities
 */
export const filterActivities = (filters = {}) => {
  let result = [...activities];

  // Filter by age groups (match ANY - better for multi-kid families)
  if (filters.ageGroups?.length > 0) {
    result = result.filter((activity) =>
      filters.ageGroups.some((ageGroup) => activity.ageGroups.includes(ageGroup))
    );
  }

  // Filter by category
  if (filters.category) {
    result = result.filter((activity) => activity.category === filters.category);
  }

  // Filter by location
  if (filters.location && filters.location !== 'both') {
    result = result.filter(
      (activity) =>
        activity.location === filters.location || activity.location === 'both'
    );
  }

  // Filter by duration
  if (filters.duration) {
    result = result.filter((activity) => activity.duration === filters.duration);
  }

  // Filter by available time
  if (filters.availableTime) {
    const validDurations = [];
    for (const [key, duration] of Object.entries(DURATIONS)) {
      if (duration.min <= filters.availableTime) {
        validDurations.push(duration.id);
      }
    }
    result = result.filter((activity) =>
      validDurations.includes(activity.duration)
    );
  }

  // Filter by energy (relaxed - include adjacent energy levels)
  // High energy can include medium, low energy can include medium
  // This prevents being too restrictive while still respecting the preference
  if (filters.energy) {
    result = result.filter((activity) => {
      if (activity.energy === filters.energy) return true;
      // Medium energy activities are always included as a bridge
      if (activity.energy === 'medium') return true;
      return false;
    });
  }

  // Filter by interests (match ANY)
  if (filters.interests?.length > 0) {
    result = result.filter((activity) =>
      activity.interests.some((interest) => filters.interests.includes(interest))
    );
  }

  // Filter by search query
  if (filters.search) {
    const lowerQuery = filters.search.toLowerCase().trim();
    result = result.filter(
      (activity) =>
        activity.title.toLowerCase().includes(lowerQuery) ||
        activity.description.toLowerCase().includes(lowerQuery) ||
        activity.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter by no supplies needed (legacy)
  if (filters.requiresNoSupplies) {
    result = result.filter((activity) => activity.materials === 'none');
  }

  // Filter by materials level
  // 'none' = only activities requiring no supplies
  // 'basic' = activities requiring none or basic supplies
  // null/undefined = show all (no filter)
  if (filters.materials === 'none') {
    result = result.filter((activity) => activity.materials === 'none');
  } else if (filters.materials === 'basic') {
    result = result.filter((activity) =>
      activity.materials === 'none' || activity.materials === 'basic'
    );
  }
  // If materials is null/undefined, don't filter (show all)

  return result;
};

/**
 * Seeded random number generator for reproducible shuffling within a session
 * Uses a simple linear congruential generator
 */
const createSeededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/**
 * Shuffle array using Fisher-Yates with seeded random
 */
const seededShuffle = (array, random) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Get recommended activities for kids
 * Combines age filtering, interest matching, popularity, and preference boosts
 * Includes session-based randomization for variety between sessions
 *
 * IMPORTANT: Returns a mix of free and premium activities to ensure free users
 * always get value while also seeing premium activities as "teasers".
 * Target mix: ~80% free activities, ~20% premium (locked) activities
 *
 * With 124+ free activities in the pool, users have plenty of variety for
 * sustained daily engagement while locked activities drive upgrade consideration.
 *
 * @param {Array<{age: number, interests: string[]}>} kids - Array of kids
 * @param {Object} [options] - Additional options
 * @param {number} [options.count=10] - Number of recommendations
 * @param {string} [options.location] - Location preference
 * @param {number} [options.availableTime] - Time available in minutes
 * @param {string} [options.energy] - Energy level preference
 * @param {string} [options.materials] - Materials filter (none, basic, or null for any)
 * @param {Object} [options.categoryBoosts] - Category preference boosts from learning
 * @returns {Activity[]} Recommended activities (mixed free and premium)
 */
export const getRecommendedActivities = (kids, options = {}) => {
  const { count = 10, location, availableTime, energy, materials, categoryBoosts = {} } = options;

  // Get combined age groups and interests from all kids
  const ageGroups = getAgeGroupsFromKids(kids);
  const interests = getInterestsFromKids(kids);

  // Build filters
  const filters = {
    ageGroups,
    location,
    availableTime,
    energy,
    materials,
  };

  // Get filtered activities
  let result = filterActivities(filters);

  // Create a session seed based on current time (changes every 10 minutes for variety)
  // This ensures users get different results in different sessions but consistent within a session
  const sessionSeed = Math.floor(Date.now() / (10 * 60 * 1000));
  const random = createSeededRandom(sessionSeed);

  // Score activities by interest match, category boosts, and popularity
  const scoredActivities = result.map((activity) => {
    const interestMatches = activity.interests?.filter((i) =>
      interests.includes(i)
    ).length || 0;

    // Apply category boost from preference learning (-1 to +1, scaled to -15 to +15 points)
    const category = activity.category?.toLowerCase();
    const categoryBoost = (categoryBoosts[category] || 0) * 15;

    return {
      ...activity,
      relevanceScore: activity.popularityScore + interestMatches * 10 + categoryBoost,
    };
  });

  // Separate free and premium activities
  const freeActivities = scoredActivities.filter(a => a.isFree === true);
  const premiumActivities = scoredActivities.filter(a => a.isFree !== true);

  // Sort each group by relevance score (highest first)
  const sortByScore = (a, b) => b.relevanceScore - a.relevanceScore;
  freeActivities.sort(sortByScore);
  premiumActivities.sort(sortByScore);

  // Shuffle within top tier of each group for variety
  // With 124 free activities, we can show more variety from the free pool
  const shuffledFree = seededShuffle(freeActivities.slice(0, Math.min(30, freeActivities.length)), random);
  const shuffledPremium = seededShuffle(premiumActivities.slice(0, Math.min(10, premiumActivities.length)), random);

  // Calculate target counts: ~80% free, ~20% premium (teasers)
  // This ensures free users get lots of value while still seeing premium as upgrade opportunities
  const targetFreeCount = Math.max(Math.ceil(count * 0.8), Math.min(count - 1, shuffledFree.length));
  const targetPremiumCount = Math.min(count - targetFreeCount, shuffledPremium.length);

  // Select activities
  const selectedFree = shuffledFree.slice(0, targetFreeCount);
  const selectedPremium = shuffledPremium.slice(0, targetPremiumCount);

  // Combine and interleave: alternate free, free, premium pattern
  const combined = [];
  let freeIdx = 0;
  let premiumIdx = 0;

  while (combined.length < count && (freeIdx < selectedFree.length || premiumIdx < selectedPremium.length)) {
    // Add 2 free activities
    if (freeIdx < selectedFree.length) {
      combined.push(selectedFree[freeIdx++]);
    }
    if (freeIdx < selectedFree.length && combined.length < count) {
      combined.push(selectedFree[freeIdx++]);
    }
    // Add 1 premium activity
    if (premiumIdx < selectedPremium.length && combined.length < count) {
      combined.push(selectedPremium[premiumIdx++]);
    }
  }

  // Final shuffle to make the pattern less predictable
  const finalResult = seededShuffle(combined, random);

  return finalResult.slice(0, count);
};

/**
 * Get all activities
 * @returns {Activity[]} All activities
 */
export const getAllActivities = () => activities;

/**
 * Get only free activities
 * @returns {Activity[]} Free activities
 */
export const getFreeActivities = () => activities.filter(a => a.isFree === true);

/**
 * Get only premium (non-free) activities
 * @returns {Activity[]} Premium activities
 */
export const getPremiumActivities = () => activities.filter(a => a.isFree !== true);

/**
 * Get activity count
 * @returns {number} Total number of activities
 */
export const getActivityCount = () => activities.length;

/**
 * Get free activity count
 * @returns {number} Number of free activities
 */
export const getFreeActivityCount = () => activities.filter(a => a.isFree === true).length;

export default {
  getAgeGroupFromAge,
  getAgeGroupsFromKids,
  getInterestsFromKids,
  filterByAgeGroup,
  filterByAgeGroups,
  filterByCategory,
  filterByLocation,
  filterByDuration,
  filterByAvailableTime,
  filterByEnergy,
  filterByInterests,
  searchActivities,
  getActivityById,
  getRandomActivities,
  sortByPopularity,
  groupByCategory,
  getCategoriesWithCounts,
  filterActivities,
  getRecommendedActivities,
  getAllActivities,
  getFreeActivities,
  getPremiumActivities,
  getActivityCount,
  getFreeActivityCount,
};
