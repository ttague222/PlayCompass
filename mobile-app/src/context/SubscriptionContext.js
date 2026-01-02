/**
 * PlayCompass Subscription Context
 *
 * Manages subscription state and feature gates
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import functions from '@react-native-firebase/functions';
import { useAuth } from './AuthContext';
import {
  SUBSCRIPTION_TIERS,
  getSubscriptionStatus,
  canGetRecommendations,
  canAddKid,
  isCategoryAvailable,
  isFeatureAvailable,
  incrementRecommendationUsage,
  getUpgradeSuggestion,
  updateSubscription,
} from '../services/subscriptionService';
import {
  setUserId as setPurchaseUserId,
  clearUserId as clearPurchaseUserId,
  getSubscriptionStatus as getPurchaseStatus,
  getOfferings,
  purchasePackage,
  restorePurchases as restorePurchasesService,
  addCustomerInfoListener,
} from '../services/purchaseService';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: 'free',
    isTrialPeriod: false,
    trialEndsAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Load subscription status when user changes
  useEffect(() => {
    const loadSubscription = async () => {
      if (user?.uid) {
        setLoading(true);

        // Set user ID for RevenueCat
        try {
          await setPurchaseUserId(user.uid);
        } catch (error) {
          console.log('[Subscription] Failed to set purchase user ID:', error);
        }

        // Try to get subscription from RevenueCat first
        try {
          const purchaseStatus = await getPurchaseStatus();
          if (purchaseStatus.tier !== 'free') {
            // User has active subscription via RevenueCat
            setSubscription({
              tier: purchaseStatus.tier,
              expiresAt: purchaseStatus.expiresAt,
              isTrialPeriod: purchaseStatus.isTrialPeriod || false,
              trialEndsAt: purchaseStatus.trialEndsAt,
              source: 'revenuecat',
            });

            // Sync to Firestore
            await updateSubscription(user.uid, purchaseStatus.tier, {
              expiresAt: purchaseStatus.expiresAt,
              isTrialPeriod: purchaseStatus.isTrialPeriod,
              platform: 'revenuecat',
            });
          } else {
            // Fall back to Firestore status
            const status = await getSubscriptionStatus(user.uid);
            setSubscription({ ...status, isTrialPeriod: false, trialEndsAt: null });
          }
        } catch (error) {
          // RevenueCat failed, fall back to Firestore
          console.log('[Subscription] RevenueCat check failed, using Firestore:', error);
          const status = await getSubscriptionStatus(user.uid);
          setSubscription({ ...status, isTrialPeriod: false, trialEndsAt: null });
        }

        // Load available offerings
        try {
          const availableOfferings = await getOfferings();
          setOfferings(availableOfferings);
        } catch (error) {
          console.log('[Subscription] Failed to load offerings:', error);
        }

        // Load current usage
        const recommendationCheck = await canGetRecommendations(subscription.tier);
        setUsage({
          recommendations: recommendationCheck,
        });

        setLoading(false);
      } else {
        // Clear RevenueCat user
        try {
          await clearPurchaseUserId();
        } catch (error) {
          console.log('[Subscription] Failed to clear purchase user:', error);
        }
        setSubscription({ tier: 'free' });
        setOfferings([]);
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user?.uid]);

  // Listen for RevenueCat subscription changes
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = addCustomerInfoListener(async ({ tier }) => {
      console.log('[Subscription] RevenueCat update received, tier:', tier);
      setSubscription((prev) => ({ ...prev, tier, source: 'revenuecat' }));

      // Sync to Firestore
      await updateSubscription(user.uid, tier);

      // Refresh usage
      const recommendationCheck = await canGetRecommendations(tier);
      setUsage((prev) => ({ ...prev, recommendations: recommendationCheck }));
    });

    return unsubscribe;
  }, [user?.uid]);

  // Get current tier config
  const tierConfig = SUBSCRIPTION_TIERS[subscription.tier] || SUBSCRIPTION_TIERS.free;

  // Check if user can use a feature
  const checkFeature = useCallback(
    (feature) => {
      return isFeatureAvailable(feature, subscription.tier);
    },
    [subscription.tier]
  );

  // Check if user can add more kids
  const checkCanAddKid = useCallback(
    (currentKidCount) => {
      return canAddKid(currentKidCount, subscription.tier);
    },
    [subscription.tier]
  );

  // Check if user can get more recommendations
  const checkCanGetRecommendations = useCallback(async () => {
    const result = await canGetRecommendations(subscription.tier);
    setUsage((prev) => ({ ...prev, recommendations: result }));
    return result;
  }, [subscription.tier]);

  // Record a recommendation session
  const recordRecommendationUsage = useCallback(async () => {
    await incrementRecommendationUsage();
    // Refresh usage
    const result = await canGetRecommendations(subscription.tier);
    setUsage((prev) => ({ ...prev, recommendations: result }));
    return result;
  }, [subscription.tier]);

  // Check if category is available
  const checkCategory = useCallback(
    (category) => {
      return isCategoryAvailable(category, subscription.tier);
    },
    [subscription.tier]
  );

  // Get upgrade suggestion
  const getSuggestion = useCallback(
    (blockedFeature) => {
      return getUpgradeSuggestion(blockedFeature, subscription.tier);
    },
    [subscription.tier]
  );

  // Purchase a subscription package
  const purchase = useCallback(
    async (pkg) => {
      setPurchaseLoading(true);
      try {
        const result = await purchasePackage(pkg);
        if (result.success) {
          // Update subscription state
          setSubscription((prev) => ({
            ...prev,
            tier: result.tier,
            source: 'revenuecat',
          }));

          // Sync to Firestore
          if (user?.uid) {
            await updateSubscription(user.uid, result.tier);
          }

          // Refresh usage
          const recommendationCheck = await canGetRecommendations(result.tier);
          setUsage((prev) => ({ ...prev, recommendations: recommendationCheck }));
        }
        setPurchaseLoading(false);
        return result;
      } catch (error) {
        setPurchaseLoading(false);
        return { success: false, error: error.message };
      }
    },
    [user?.uid]
  );

  // Restore previous purchases
  const restorePurchases = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const result = await restorePurchasesService();
      if (result.success && result.tier !== 'free') {
        // Update subscription state
        setSubscription((prev) => ({
          ...prev,
          tier: result.tier,
          source: 'revenuecat',
        }));

        // Sync to Firestore
        if (user?.uid) {
          await updateSubscription(user.uid, result.tier);
        }

        // Refresh usage
        const recommendationCheck = await canGetRecommendations(result.tier);
        setUsage((prev) => ({ ...prev, recommendations: recommendationCheck }));
      }
      setPurchaseLoading(false);
      return result;
    } catch (error) {
      setPurchaseLoading(false);
      return { success: false, error: error.message };
    }
  }, [user?.uid]);

  // Server-side validation functions (for sensitive operations)
  const validateSubscriptionServer = useCallback(async () => {
    try {
      const validateFn = functions().httpsCallable('validateSubscription');
      const result = await validateFn({});
      if (result.data.success) {
        // Update local state if server says different tier
        if (result.data.tier !== subscription.tier) {
          setSubscription((prev) => ({
            ...prev,
            tier: result.data.tier,
            source: 'server',
          }));
        }
        return result.data;
      }
      return { success: false };
    } catch (error) {
      console.log('[Subscription] Server validation failed:', error);
      // Fall back to local state
      return { success: true, tier: subscription.tier };
    }
  }, [subscription.tier]);

  const validateRecommendationLimitServer = useCallback(async (increment = false) => {
    try {
      const validateFn = functions().httpsCallable('validateRecommendationLimit');
      const result = await validateFn({ increment });
      if (result.data.success) {
        // Update local usage state
        setUsage((prev) => ({
          ...prev,
          recommendations: {
            allowed: result.data.allowed,
            used: result.data.used,
            limit: result.data.limit,
            remaining: result.data.remaining,
          },
        }));
        return result.data;
      }
      return { success: false, allowed: false };
    } catch (error) {
      console.log('[Subscription] Server recommendation limit check failed:', error);
      // Fall back to local check
      const localCheck = await canGetRecommendations(subscription.tier);
      return { success: true, ...localCheck };
    }
  }, [subscription.tier]);

  const validateKidLimitServer = useCallback(async (action = 'check') => {
    try {
      const validateFn = functions().httpsCallable('validateKidLimit');
      const result = await validateFn({ action });
      return result.data;
    } catch (error) {
      console.log('[Subscription] Server kid limit check failed:', error);
      // Fall back to local check (caller should handle this)
      return { success: false, error: error.message };
    }
  }, []);

  const value = {
    // Subscription state
    subscription,
    tier: subscription.tier,
    tierConfig,
    isPremium: subscription.tier !== 'free',
    isTrialPeriod: subscription.isTrialPeriod || false,
    trialEndsAt: subscription.trialEndsAt,
    loading,
    purchaseLoading,
    usage,
    offerings,

    // Feature checks
    checkFeature,
    checkCanAddKid,
    checkCanGetRecommendations,
    checkCategory,

    // Actions
    recordRecommendationUsage,
    getSuggestion,
    purchase,
    restorePurchases,

    // Server-side validation (for sensitive operations)
    validateSubscriptionServer,
    validateRecommendationLimitServer,
    validateKidLimitServer,

    // Tier info
    allTiers: SUBSCRIPTION_TIERS,
  };

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;
