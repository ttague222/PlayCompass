/**
 * PlayCompass Subscription Service
 *
 * Manages feature access based on owned packs and premium lifetime status.
 * Replaces the old tier-based subscription model with pack-based purchases.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import {
  ACTIVITY_PACKS,
  PREMIUM_LIFETIME,
  isActivityUnlocked as checkActivityUnlocked,
  hasPackAccess as checkPackAccess,
  getPackForActivity,
} from '../data/activityPacks';

const USAGE_KEY = '@playcompass_usage';

/**
 * Tier configurations for feature limits
 * - free: Basic access with limits
 * - premiumLifetime: Full access with no limits
 */
export const TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    features: {
      dailyRecommendations: 3,
      maxKids: 2,
      historyDays: 7,
      customActivities: false,
      scheduling: false,
      offlineMode: false,
      detailedInstructions: false,
      progressTracking: false,
    },
  },
  premiumLifetime: {
    id: 'premiumLifetime',
    name: 'Premium Lifetime',
    features: {
      dailyRecommendations: 'unlimited',
      maxKids: 10,
      historyDays: 365,
      customActivities: true,
      scheduling: true,
      offlineMode: true,
      detailedInstructions: true,
      progressTracking: true,
    },
  },
};

// Re-export for backwards compatibility
export const SUBSCRIPTION_TIERS = TIERS;

/**
 * Feature descriptions for UI display
 */
export const FEATURE_DESCRIPTIONS = {
  dailyRecommendations: {
    name: 'Daily Recommendations',
    icon: '🎯',
    description: 'Number of activity recommendations you can get each day',
  },
  maxKids: {
    name: 'Child Profiles',
    icon: '👶',
    description: 'Maximum number of child profiles you can create',
  },
  historyDays: {
    name: 'History Storage',
    icon: '📋',
    description: 'How long we keep your activity history',
  },
  customActivities: {
    name: 'Custom Activities',
    icon: '✨',
    description: 'Create and save your own activities',
  },
  scheduling: {
    name: 'Activity Scheduling',
    icon: '📅',
    description: 'Plan your week with scheduled activities and reminders',
  },
  offlineMode: {
    name: 'Offline Mode',
    icon: '📴',
    description: 'Use PlayCompass without internet connection',
  },
  detailedInstructions: {
    name: 'Step-by-Step Instructions',
    icon: '📝',
    description: 'Detailed instructions, pro tips, and creative variations for each activity',
  },
  progressTracking: {
    name: 'Progress Tracking',
    icon: '📊',
    description: 'Track achievements, earn badges, and see detailed monthly reports',
  },
};

// Re-export pack helpers for convenience
export { isActivityUnlocked, hasPackAccess, getPackForActivity } from '../data/activityPacks';

/**
 * Get the effective tier based on premium lifetime status
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {string} 'premiumLifetime' or 'free'
 */
export const getEffectiveTier = (hasPremiumLifetime) => {
  return hasPremiumLifetime ? 'premiumLifetime' : 'free';
};

/**
 * Get tier configuration based on premium status
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {Object} Tier configuration
 */
export const getTierConfig = (hasPremiumLifetime) => {
  return hasPremiumLifetime ? TIERS.premiumLifetime : TIERS.free;
};

/**
 * Check if a feature is available based on owned packs and premium status
 * @param {string} feature - Feature name
 * @param {string[]} ownedPacks - Array of owned pack IDs
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {boolean} Whether feature is available
 */
export const isFeatureAvailable = (feature, ownedPacks = [], hasPremiumLifetime = false) => {
  // Premium lifetime gets all features
  if (hasPremiumLifetime) {
    return true;
  }

  // Check tier-based features
  const tierConfig = TIERS.free;
  const featureValue = tierConfig.features[feature];

  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  if (featureValue === 'unlimited') {
    return true;
  }
  return featureValue > 0;
};

/**
 * Get current usage stats from local storage
 */
export const getUsageStats = async () => {
  try {
    const stored = await AsyncStorage.getItem(USAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored);
      // Check if it's a new day
      const today = new Date().toDateString();
      if (usage.date !== today) {
        // Reset daily counts
        return {
          date: today,
          recommendationSessions: 0,
          lastReset: new Date().toISOString(),
        };
      }
      return usage;
    }
    return {
      date: new Date().toDateString(),
      recommendationSessions: 0,
      lastReset: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      date: new Date().toDateString(),
      recommendationSessions: 0,
      lastReset: new Date().toISOString(),
    };
  }
};

/**
 * Save usage stats to local storage
 */
export const saveUsageStats = async (usage) => {
  try {
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.error('Error saving usage stats:', error);
  }
};

/**
 * Reset usage stats (used when account is deleted)
 */
export const resetUsageStats = async () => {
  try {
    await AsyncStorage.removeItem(USAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error resetting usage stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Increment daily recommendation count
 */
export const incrementRecommendationUsage = async () => {
  const usage = await getUsageStats();
  usage.recommendationSessions = (usage.recommendationSessions || 0) + 1;
  await saveUsageStats(usage);
  return usage;
};

/**
 * Check if user can get more recommendations today
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {Promise<Object>} Recommendation allowance info
 */
export const canGetRecommendations = async (hasPremiumLifetime = false) => {
  const tierConfig = getTierConfig(hasPremiumLifetime);
  const limit = tierConfig.features.dailyRecommendations;

  // Unlimited for premium lifetime
  if (limit === 'unlimited') {
    return { allowed: true, remaining: 'unlimited', used: 0 };
  }

  const usage = await getUsageStats();
  const used = usage.recommendationSessions || 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    remaining,
    used,
    limit,
  };
};

/**
 * Check if user can add more kids
 * @param {number} currentKidCount - Current number of kids
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {Object} Kid limit info
 */
export const canAddKid = (currentKidCount, hasPremiumLifetime = false) => {
  const tierConfig = getTierConfig(hasPremiumLifetime);
  const limit = tierConfig.features.maxKids;

  return {
    allowed: currentKidCount < limit,
    remaining: Math.max(0, limit - currentKidCount),
    limit,
  };
};

/**
 * Check if a category/pack is available
 * @param {string} category - Category/pack ID
 * @param {string[]} ownedPacks - Array of owned pack IDs
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {boolean} Whether category is available
 */
export const isCategoryAvailable = (category, ownedPacks = [], hasPremiumLifetime = false) => {
  // Premium lifetime gets all categories
  if (hasPremiumLifetime) {
    return true;
  }

  // Check if user owns this pack
  return ownedPacks.includes(category);
};

/**
 * Get all available categories for user
 * @param {string[]} ownedPacks - Array of owned pack IDs
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {string[]|'all'} Available categories
 */
export const getAvailableCategories = (ownedPacks = [], hasPremiumLifetime = false) => {
  if (hasPremiumLifetime) {
    return 'all';
  }
  return ownedPacks;
};

/**
 * Get pack suggestion for a locked activity
 * @param {Object} activity - The locked activity
 * @returns {Object|null} Pack suggestion info
 */
export const getPackSuggestion = (activity) => {
  const packId = getPackForActivity(activity);
  if (!packId) {
    return null;
  }

  const pack = ACTIVITY_PACKS[packId];
  if (!pack) {
    return null;
  }

  return {
    pack,
    premiumLifetime: PREMIUM_LIFETIME,
    activity,
  };
};

/**
 * Update purchases in Firestore
 * @param {string} userId - User ID
 * @param {string[]} ownedPacks - Array of owned pack IDs
 * @param {boolean} hasPremiumLifetime - Whether user has premium lifetime
 * @returns {Promise<Object>} Result
 */
export const updatePurchases = async (userId, ownedPacks = [], hasPremiumLifetime = false) => {
  try {
    await firestore().collection('users').doc(userId).update({
      purchases: {
        ownedPacks,
        hasPremiumLifetime,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating purchases:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get purchase status from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Purchase status
 */
export const getPurchaseStatus = async (userId) => {
  try {
    const docRef = firestore().collection('users').doc(userId);
    const doc = await docRef.get();

    if (doc.exists()) {
      const data = doc.data();
      const purchases = data?.purchases || { ownedPacks: [], hasPremiumLifetime: false };

      return {
        ownedPacks: purchases.ownedPacks || [],
        hasPremiumLifetime: purchases.hasPremiumLifetime || false,
        tier: purchases.hasPremiumLifetime ? 'premiumLifetime' : 'free',
      };
    }

    return {
      ownedPacks: [],
      hasPremiumLifetime: false,
      tier: 'free',
    };
  } catch (error) {
    console.error('Error getting purchase status:', error);
    return {
      ownedPacks: [],
      hasPremiumLifetime: false,
      tier: 'free',
    };
  }
};

// Legacy function for backwards compatibility
export const getSubscriptionStatus = async (userId) => {
  const purchaseStatus = await getPurchaseStatus(userId);
  return {
    tier: purchaseStatus.tier,
    ownedPacks: purchaseStatus.ownedPacks,
    hasPremiumLifetime: purchaseStatus.hasPremiumLifetime,
    // Legacy fields (for backwards compat during transition)
    isInTrial: false,
    daysRemaining: 0,
    trialExpired: true,
  };
};

// Legacy function - kept for backwards compatibility
export const updateSubscription = async (userId, tier, purchaseInfo = null) => {
  // Map old tier to new purchase model
  const hasPremiumLifetime = tier === 'premiumLifetime' || tier === 'plus' || tier === 'family';
  return updatePurchases(userId, [], hasPremiumLifetime);
};

export default {
  TIERS,
  SUBSCRIPTION_TIERS: TIERS,
  FEATURE_DESCRIPTIONS,
  ACTIVITY_PACKS,
  PREMIUM_LIFETIME,
  getEffectiveTier,
  getTierConfig,
  isFeatureAvailable,
  getUsageStats,
  saveUsageStats,
  resetUsageStats,
  incrementRecommendationUsage,
  canGetRecommendations,
  canAddKid,
  isCategoryAvailable,
  getAvailableCategories,
  getPackSuggestion,
  updatePurchases,
  getPurchaseStatus,
  getSubscriptionStatus,
  updateSubscription,
};
