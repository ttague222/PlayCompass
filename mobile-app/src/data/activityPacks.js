/**
 * PlayCompass Activity Packs
 *
 * Defines purchasable activity packs and premium lifetime options.
 * Each pack unlocks activities in a specific category.
 */

/**
 * Activity Pack Definitions
 * Each pack corresponds to an activity category and unlocks premium features for that category.
 */
export const ACTIVITY_PACKS = {
  educational: {
    id: 'educational',
    productId: 'playcompass_pack_educational',
    name: 'Educational Pack',
    description: 'Spark curiosity with science experiments, learning games, and discovery activities that make education fun',
    emoji: '📚',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'educational',
    color: '#3b82f6', // blue
  },
  creative: {
    id: 'creative',
    productId: 'playcompass_pack_creative',
    name: 'Creative Pack',
    description: 'Unleash imagination through arts, crafts, building projects, and creative expression activities',
    emoji: '🎨',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'creative',
    color: '#f59e0b', // amber
  },
  active: {
    id: 'active',
    productId: 'playcompass_pack_active',
    name: 'Active Pack',
    description: 'Get moving with sports, dance, exercise games, and high-energy activities that burn off steam',
    emoji: '🏃',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'active',
    color: '#ef4444', // red
  },
  games: {
    id: 'games',
    productId: 'playcompass_pack_games',
    name: 'Games Pack',
    description: 'Hours of fun with board games, card games, puzzles, and interactive play for all ages',
    emoji: '🎮',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'games',
    color: '#6366f1', // indigo
  },
  calm: {
    id: 'calm',
    productId: 'playcompass_pack_calm',
    name: 'Calm Pack',
    description: 'Wind down with relaxing activities like reading, mindfulness, gentle crafts, and quiet play',
    emoji: '😌',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'calm',
    color: '#06b6d4', // cyan
  },
  outdoor: {
    id: 'outdoor',
    productId: 'playcompass_pack_outdoor',
    name: 'Outdoor Pack',
    description: 'Explore nature with hiking, gardening, outdoor games, and adventures in the fresh air',
    emoji: '🌳',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'outdoor',
    color: '#10b981', // green
  },
  social: {
    id: 'social',
    productId: 'playcompass_pack_social',
    name: 'Social Pack',
    description: 'Build connections through group games, team activities, and cooperative play for siblings and friends',
    emoji: '👥',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'social',
    color: '#8b5cf6', // purple
  },
  music: {
    id: 'music',
    productId: 'playcompass_pack_music',
    name: 'Music Pack',
    description: 'Make some noise with singing, dancing, instrument play, and rhythm activities',
    emoji: '🎵',
    price: 0.99,
    priceLabel: '$0.99',
    category: 'music',
    color: '#ec4899', // pink
  },
};

/**
 * Premium Lifetime Purchase
 * Unlocks all packs and premium features forever.
 */
export const PREMIUM_LIFETIME = {
  id: 'premium_lifetime',
  productId: 'playcompass_premium_lifetime',
  name: 'Premium Lifetime',
  description: 'All packs + unlimited features forever',
  emoji: '👑',
  price: 4.99,
  priceLabel: '$4.99',
  color: '#fbbf24', // gold
  features: [
    'allPacks',
    'unlimitedRecommendations',
    'unlimitedKids',
    'offlineMode',
    'customActivities',
    'scheduling',
    'detailedInstructions',
    'progressTracking',
  ],
  featureDescriptions: [
    { icon: '📦', label: 'All Activity Packs', description: 'Every pack included' },
    { icon: '🎯', label: 'Unlimited Recommendations', description: 'No daily limits' },
    { icon: '👶', label: 'Up to 10 Kids', description: 'Add your whole family' },
    { icon: '📴', label: 'Offline Mode', description: 'Use without internet' },
    { icon: '✨', label: 'Custom Activities', description: 'Create your own' },
    { icon: '📅', label: 'Activity Scheduling', description: 'Plan your week' },
  ],
};

/**
 * All product IDs for RevenueCat
 */
export const PRODUCT_IDS = {
  // Activity Packs (non-consumable)
  pack_educational: 'playcompass_pack_educational',
  pack_creative: 'playcompass_pack_creative',
  pack_active: 'playcompass_pack_active',
  pack_games: 'playcompass_pack_games',
  pack_calm: 'playcompass_pack_calm',
  pack_outdoor: 'playcompass_pack_outdoor',
  pack_social: 'playcompass_pack_social',
  pack_music: 'playcompass_pack_music',
  // Premium Lifetime (non-consumable)
  premium_lifetime: 'playcompass_premium_lifetime',
};

/**
 * Map product IDs to pack IDs
 */
export const PRODUCT_TO_PACK = {
  playcompass_pack_educational: 'educational',
  playcompass_pack_creative: 'creative',
  playcompass_pack_active: 'active',
  playcompass_pack_games: 'games',
  playcompass_pack_calm: 'calm',
  playcompass_pack_outdoor: 'outdoor',
  playcompass_pack_social: 'social',
  playcompass_pack_music: 'music',
};

/**
 * Get the pack ID that contains a given activity.
 * Activities are assigned to packs based on their category.
 *
 * @param {Object} activity - The activity object
 * @returns {string} The pack ID (matches category)
 */
export const getPackForActivity = (activity) => {
  if (!activity || !activity.category) {
    return null;
  }
  // Pack ID matches category ID
  return activity.category;
};

/**
 * Get pack info for a given pack ID
 *
 * @param {string} packId - The pack ID
 * @returns {Object|null} The pack configuration or null
 */
export const getPackInfo = (packId) => {
  return ACTIVITY_PACKS[packId] || null;
};

/**
 * Check if an activity is unlocked for a user.
 * An activity is unlocked if:
 * 1. User has Premium Lifetime
 * 2. Activity is marked as free (isFree: true)
 * 3. User owns the pack that contains the activity
 *
 * @param {Object} activity - The activity object
 * @param {string[]} ownedPacks - Array of pack IDs the user owns
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {boolean} Whether the activity is unlocked
 */
export const isActivityUnlocked = (activity, ownedPacks = [], hasPremiumLifetime = false) => {
  // Premium lifetime unlocks everything
  if (hasPremiumLifetime) {
    return true;
  }

  // Check if activity is marked as free
  if (activity?.isFree === true) {
    return true;
  }

  // Get the pack this activity belongs to
  const packId = getPackForActivity(activity);

  // If no pack association (no category), treat as free
  if (!packId) {
    return true;
  }

  // Check if user owns the pack
  return ownedPacks.includes(packId);
};

/**
 * Check if user has access to a specific pack
 *
 * @param {string} packId - The pack ID to check
 * @param {string[]} ownedPacks - Array of pack IDs the user owns
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {boolean} Whether user has access
 */
export const hasPackAccess = (packId, ownedPacks = [], hasPremiumLifetime = false) => {
  if (hasPremiumLifetime) {
    return true;
  }
  return ownedPacks.includes(packId);
};

/**
 * Get activity count per pack from a list of activities
 *
 * @param {Array} activities - Array of activity objects
 * @returns {Object} Map of packId to activity count
 */
export const getActivityCountByPack = (activities) => {
  const counts = {};

  Object.keys(ACTIVITY_PACKS).forEach((packId) => {
    counts[packId] = 0;
  });

  activities.forEach((activity) => {
    const packId = getPackForActivity(activity);
    if (packId && counts[packId] !== undefined) {
      counts[packId]++;
    }
  });

  return counts;
};

/**
 * Get all pack IDs as an array
 */
export const getAllPackIds = () => Object.keys(ACTIVITY_PACKS);

/**
 * Get all packs as an array
 */
export const getAllPacks = () => Object.values(ACTIVITY_PACKS);

/**
 * Get counts of free vs premium activities per pack
 *
 * @param {Array} activities - Array of activity objects
 * @returns {Object} Map of packId to { free: number, premium: number, total: number }
 */
export const getActivityCountsByType = (activities) => {
  const counts = {};

  // Initialize counts for all packs
  Object.keys(ACTIVITY_PACKS).forEach((packId) => {
    counts[packId] = { free: 0, premium: 0, total: 0 };
  });

  activities.forEach((activity) => {
    const packId = getPackForActivity(activity);
    if (packId && counts[packId] !== undefined) {
      counts[packId].total++;
      if (activity.isFree) {
        counts[packId].free++;
      } else {
        counts[packId].premium++;
      }
    }
  });

  return counts;
};

/**
 * Get total count of free activities
 *
 * @param {Array} activities - Array of activity objects
 * @returns {number} Count of free activities
 */
export const getFreeActivityCount = (activities) => {
  return activities.filter((a) => a.isFree === true).length;
};

/**
 * Get total count of premium (non-free) activities
 *
 * @param {Array} activities - Array of activity objects
 * @returns {number} Count of premium activities
 */
export const getPremiumActivityCount = (activities) => {
  return activities.filter((a) => a.isFree !== true).length;
};

export default {
  ACTIVITY_PACKS,
  PREMIUM_LIFETIME,
  PRODUCT_IDS,
  PRODUCT_TO_PACK,
  getPackForActivity,
  getPackInfo,
  isActivityUnlocked,
  hasPackAccess,
  getActivityCountByPack,
  getActivityCountsByType,
  getFreeActivityCount,
  getPremiumActivityCount,
  getAllPackIds,
  getAllPacks,
};
