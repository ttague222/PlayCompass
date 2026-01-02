/**
 * PlayCompass Subscription Service
 *
 * Manages subscription tiers and feature gates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

const USAGE_KEY = '@playcompass_usage';

/**
 * Subscription tiers configuration
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    features: {
      dailyRecommendations: 3,
      maxKids: 2,
      historyDays: 7,
      categories: ['creative', 'games', 'physical', 'educational'], // Limited categories
      customActivities: false,
      prioritySupport: false,
      offlineMode: false,
    },
    description: 'Perfect for trying out PlayCompass',
  },
  plus: {
    id: 'plus',
    name: 'PlayCompass+',
    price: 4.99,
    priceLabel: '$4.99/month',
    features: {
      dailyRecommendations: 15,
      maxKids: 5,
      historyDays: 30,
      categories: 'all', // All categories
      customActivities: true,
      prioritySupport: false,
      offlineMode: true,
    },
    description: 'For active families who want more variety',
  },
  family: {
    id: 'family',
    name: 'Family Pro',
    price: 9.99,
    priceLabel: '$9.99/month',
    features: {
      dailyRecommendations: 'unlimited',
      maxKids: 10,
      historyDays: 365,
      categories: 'all',
      customActivities: true,
      prioritySupport: true,
      offlineMode: true,
    },
    description: 'The complete PlayCompass experience',
  },
};

/**
 * Feature descriptions for upsell
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
  categories: {
    name: 'Activity Categories',
    icon: '📚',
    description: 'Access to all activity categories',
  },
  customActivities: {
    name: 'Custom Activities',
    icon: '✨',
    description: 'Create and save your own activities',
  },
  prioritySupport: {
    name: 'Priority Support',
    icon: '💬',
    description: 'Get help faster with priority support',
  },
  offlineMode: {
    name: 'Offline Mode',
    icon: '📴',
    description: 'Use PlayCompass without internet connection',
  },
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
 */
export const canGetRecommendations = async (tier = 'free') => {
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
  const limit = tierConfig.features.dailyRecommendations;

  // Unlimited for paid tiers
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
 */
export const canAddKid = (currentKidCount, tier = 'free') => {
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
  const limit = tierConfig.features.maxKids;

  return {
    allowed: currentKidCount < limit,
    remaining: Math.max(0, limit - currentKidCount),
    limit,
  };
};

/**
 * Check if a category is available for the tier
 */
export const isCategoryAvailable = (category, tier = 'free') => {
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
  const categories = tierConfig.features.categories;

  if (categories === 'all') return true;
  return categories.includes(category.toLowerCase());
};

/**
 * Get all available categories for tier
 */
export const getAvailableCategories = (tier = 'free') => {
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
  return tierConfig.features.categories;
};

/**
 * Check if a feature is available
 */
export const isFeatureAvailable = (feature, tier = 'free') => {
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
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
 * Get upgrade suggestion based on blocked feature
 */
export const getUpgradeSuggestion = (blockedFeature, currentTier = 'free') => {
  const feature = FEATURE_DESCRIPTIONS[blockedFeature];

  // Find the cheapest tier that has this feature
  const tiers = Object.values(SUBSCRIPTION_TIERS);
  const currentIndex = tiers.findIndex((t) => t.id === currentTier);

  for (let i = currentIndex + 1; i < tiers.length; i++) {
    const tier = tiers[i];
    if (isFeatureAvailable(blockedFeature, tier.id)) {
      return {
        suggestedTier: tier,
        feature,
        currentTier: SUBSCRIPTION_TIERS[currentTier],
      };
    }
  }

  return null;
};

/**
 * Update subscription in Firestore
 */
export const updateSubscription = async (userId, tier, purchaseInfo = null) => {
  try {
    await firestore().collection('users').doc(userId).update({
      subscription: {
        tier,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        ...(purchaseInfo && {
          purchaseId: purchaseInfo.purchaseId,
          expiresAt: purchaseInfo.expiresAt,
          platform: purchaseInfo.platform,
        }),
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get subscription status from Firestore
 */
export const getSubscriptionStatus = async (userId) => {
  try {
    const doc = await firestore().collection('users').doc(userId).get();
    if (doc.exists) {
      const subscription = doc.data()?.subscription || { tier: 'free' };

      // Check if subscription has expired
      if (subscription.expiresAt) {
        const expiresAt = subscription.expiresAt.toDate
          ? subscription.expiresAt.toDate()
          : new Date(subscription.expiresAt);

        if (new Date() > expiresAt) {
          // Subscription expired, downgrade to free
          return { tier: 'free', expired: true, previousTier: subscription.tier };
        }
      }

      return subscription;
    }
    return { tier: 'free' };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { tier: 'free' };
  }
};

export default {
  SUBSCRIPTION_TIERS,
  FEATURE_DESCRIPTIONS,
  getUsageStats,
  saveUsageStats,
  resetUsageStats,
  incrementRecommendationUsage,
  canGetRecommendations,
  canAddKid,
  isCategoryAvailable,
  getAvailableCategories,
  isFeatureAvailable,
  getUpgradeSuggestion,
  updateSubscription,
  getSubscriptionStatus,
};
