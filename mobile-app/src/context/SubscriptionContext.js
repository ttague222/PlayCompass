/**
 * PlayCompass Subscription Context
 *
 * Manages purchase state (owned packs and premium lifetime) and provides
 * feature access checks to the entire app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  ACTIVITY_PACKS,
  PREMIUM_LIFETIME,
  isActivityUnlocked as checkActivityUnlocked,
  hasPackAccess as checkPackAccess,
  getPackForActivity,
  getAllPacks,
} from '../data/activityPacks';
import {
  TIERS,
  getTierConfig,
  isFeatureAvailable,
  canGetRecommendations,
  canAddKid,
  incrementRecommendationUsage,
  updatePurchases,
  getPurchaseStatus as getFirestorePurchaseStatus,
  getPackSuggestion,
} from '../services/subscriptionService';
import {
  setUserId as setPurchaseUserId,
  clearUserId as clearPurchaseUserId,
  getPurchaseStatus as getRevenueCatPurchaseStatus,
  getOfferings,
  purchasePack as purchasePackService,
  purchaseLifetime as purchaseLifetimeService,
  restorePurchases as restorePurchasesService,
  addCustomerInfoListener,
} from '../services/purchaseService';

const SubscriptionContext = createContext(null);

// Pre-compute stable reference for static data (getAllPacks creates new array each call)
const ALL_PACKS = getAllPacks();

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Purchase state
  const [purchases, setPurchases] = useState({
    ownedPacks: [],
    hasPremiumLifetime: false,
  });
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Computed values
  const hasPremiumLifetime = purchases.hasPremiumLifetime;
  const ownedPacks = purchases.ownedPacks;
  const tier = hasPremiumLifetime ? 'premiumLifetime' : 'free';
  const tierConfig = getTierConfig(hasPremiumLifetime);
  const isPremium = hasPremiumLifetime;

  // Load purchase status when user changes
  useEffect(() => {
    const loadPurchases = async () => {
      if (user?.uid) {
        setLoading(true);

        // Set user ID for RevenueCat
        try {
          await setPurchaseUserId(user.uid);
        } catch (error) {
          console.log('[Subscription] Failed to set purchase user ID:', error);
        }

        // Try to get purchases from RevenueCat first
        try {
          const rcStatus = await getRevenueCatPurchaseStatus();
          if (rcStatus.hasPremiumLifetime || rcStatus.ownedPacks.length > 0) {
            // User has purchases via RevenueCat
            setPurchases({
              ownedPacks: rcStatus.ownedPacks,
              hasPremiumLifetime: rcStatus.hasPremiumLifetime,
            });

            // Sync to Firestore
            await updatePurchases(user.uid, rcStatus.ownedPacks, rcStatus.hasPremiumLifetime);
          } else {
            // Fall back to Firestore status
            const firestoreStatus = await getFirestorePurchaseStatus(user.uid);
            setPurchases({
              ownedPacks: firestoreStatus.ownedPacks || [],
              hasPremiumLifetime: firestoreStatus.hasPremiumLifetime || false,
            });
          }
        } catch (error) {
          console.log('[Subscription] RevenueCat check failed, using Firestore:', error);
          const firestoreStatus = await getFirestorePurchaseStatus(user.uid);
          setPurchases({
            ownedPacks: firestoreStatus.ownedPacks || [],
            hasPremiumLifetime: firestoreStatus.hasPremiumLifetime || false,
          });
        }

        // Load available offerings
        try {
          const availableOfferings = await getOfferings();
          setOfferings(availableOfferings);
        } catch (error) {
          console.log('[Subscription] Failed to load offerings:', error);
        }

        // Load current usage
        const recommendationCheck = await canGetRecommendations(hasPremiumLifetime);
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
        setPurchases({ ownedPacks: [], hasPremiumLifetime: false });
        setOfferings([]);
        setLoading(false);
      }
    };

    loadPurchases();
  }, [user?.uid]);

  // Listen for RevenueCat purchase updates
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = addCustomerInfoListener(async ({ ownedPacks: newOwnedPacks, hasPremiumLifetime: newHasPremiumLifetime }) => {
      console.log('[Subscription] RevenueCat update received, ownedPacks:', newOwnedPacks, 'hasPremiumLifetime:', newHasPremiumLifetime);

      setPurchases({
        ownedPacks: newOwnedPacks,
        hasPremiumLifetime: newHasPremiumLifetime,
      });

      // Sync to Firestore
      await updatePurchases(user.uid, newOwnedPacks, newHasPremiumLifetime);

      // Refresh usage
      const recommendationCheck = await canGetRecommendations(newHasPremiumLifetime);
      setUsage((prev) => ({ ...prev, recommendations: recommendationCheck }));
    });

    return unsubscribe;
  }, [user?.uid]);

  // Check if user has access to a specific pack
  const hasPackAccessFn = useCallback(
    (packId) => {
      return checkPackAccess(packId, ownedPacks, hasPremiumLifetime);
    },
    [ownedPacks, hasPremiumLifetime]
  );

  // Check if an activity is unlocked
  const isActivityUnlockedFn = useCallback(
    (activity) => {
      return checkActivityUnlocked(activity, ownedPacks, hasPremiumLifetime);
    },
    [ownedPacks, hasPremiumLifetime]
  );

  // Check if a feature is available
  const checkFeature = useCallback(
    (feature) => {
      return isFeatureAvailable(feature, ownedPacks, hasPremiumLifetime);
    },
    [ownedPacks, hasPremiumLifetime]
  );

  // Check if user can add more kids
  const checkCanAddKid = useCallback(
    (currentKidCount) => {
      return canAddKid(currentKidCount, hasPremiumLifetime);
    },
    [hasPremiumLifetime]
  );

  // Check if user can get more recommendations
  const checkCanGetRecommendations = useCallback(async () => {
    const result = await canGetRecommendations(hasPremiumLifetime);
    setUsage((prev) => ({ ...prev, recommendations: result }));
    return result;
  }, [hasPremiumLifetime]);

  // Record a recommendation session
  const recordRecommendationUsage = useCallback(async () => {
    await incrementRecommendationUsage();
    const result = await canGetRecommendations(hasPremiumLifetime);
    setUsage((prev) => ({ ...prev, recommendations: result }));
    return result;
  }, [hasPremiumLifetime]);

  // Get suggestion for unlocking an activity
  const getSuggestion = useCallback(
    (activity) => {
      return getPackSuggestion(activity);
    },
    []
  );

  // Purchase a pack
  const purchasePack = useCallback(
    async (packId) => {
      setPurchaseLoading(true);
      try {
        const result = await purchasePackService(packId);
        if (result.success) {
          setPurchases({
            ownedPacks: result.ownedPacks,
            hasPremiumLifetime: result.hasPremiumLifetime,
          });

          // Sync to Firestore
          if (user?.uid) {
            await updatePurchases(user.uid, result.ownedPacks, result.hasPremiumLifetime);
          }

          // Refresh usage
          const recommendationCheck = await canGetRecommendations(result.hasPremiumLifetime);
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

  // Purchase premium lifetime
  const purchaseLifetime = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const result = await purchaseLifetimeService();
      if (result.success) {
        setPurchases({
          ownedPacks: result.ownedPacks,
          hasPremiumLifetime: result.hasPremiumLifetime,
        });

        // Sync to Firestore
        if (user?.uid) {
          await updatePurchases(user.uid, result.ownedPacks, result.hasPremiumLifetime);
        }

        // Refresh usage
        const recommendationCheck = await canGetRecommendations(result.hasPremiumLifetime);
        setUsage((prev) => ({ ...prev, recommendations: recommendationCheck }));
      }
      setPurchaseLoading(false);
      return result;
    } catch (error) {
      setPurchaseLoading(false);
      return { success: false, error: error.message };
    }
  }, [user?.uid]);

  // Restore previous purchases
  const restorePurchases = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const result = await restorePurchasesService();
      if (result.success) {
        setPurchases({
          ownedPacks: result.ownedPacks,
          hasPremiumLifetime: result.hasPremiumLifetime,
        });

        // Sync to Firestore
        if (user?.uid) {
          await updatePurchases(user.uid, result.ownedPacks, result.hasPremiumLifetime);
        }

        // Refresh usage
        const recommendationCheck = await canGetRecommendations(result.hasPremiumLifetime);
        setUsage((prev) => ({ ...prev, recommendations: recommendationCheck }));
      }
      setPurchaseLoading(false);
      return result;
    } catch (error) {
      setPurchaseLoading(false);
      return { success: false, error: error.message };
    }
  }, [user?.uid]);

  // Stabilize the nested subscription object to prevent new reference on every render
  const subscriptionInfo = useMemo(
    () => ({ tier, ownedPacks, hasPremiumLifetime }),
    [tier, ownedPacks, hasPremiumLifetime]
  );

  const value = useMemo(() => ({
    // Purchase state
    purchases,
    ownedPacks,
    hasPremiumLifetime,
    isPremium,
    loading,
    purchaseLoading,
    usage,
    offerings,

    // Tier info (for backwards compatibility)
    tier,
    tierConfig,
    effectiveTier: tier,

    // Pack info (static module-level references - never change)
    activityPacks: ACTIVITY_PACKS,
    premiumLifetime: PREMIUM_LIFETIME,
    allPacks: ALL_PACKS,
    allTiers: TIERS,

    // Feature checks (useCallback-wrapped, stable references)
    hasPackAccess: hasPackAccessFn,
    isActivityUnlocked: isActivityUnlockedFn,
    checkFeature,
    hasFeature: checkFeature, // Alias
    checkCanAddKid,
    checkCanGetRecommendations,
    getPackForActivity,

    // Actions (useCallback-wrapped, stable references)
    recordRecommendationUsage,
    getSuggestion,
    purchasePack,
    purchaseLifetime,
    restorePurchases,

    // Legacy alias
    subscription: subscriptionInfo,
  }), [
    purchases, ownedPacks, hasPremiumLifetime, isPremium, loading, purchaseLoading,
    usage, offerings, tier, tierConfig, subscriptionInfo,
    hasPackAccessFn, isActivityUnlockedFn, checkFeature, checkCanAddKid,
    checkCanGetRecommendations, getPackForActivity,
    recordRecommendationUsage, getSuggestion, purchasePack, purchaseLifetime, restorePurchases,
  ]);

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
