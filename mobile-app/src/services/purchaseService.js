/**
 * PlayCompass Purchase Service
 *
 * Handles in-app purchases via RevenueCat for activity packs and premium lifetime.
 */

import { Platform } from 'react-native';
import {
  ACTIVITY_PACKS,
  PREMIUM_LIFETIME,
  PRODUCT_TO_PACK,
} from '../data/activityPacks';

// Dynamically import RevenueCat to handle cases where native module isn't available
let Purchases = null;
let LOG_LEVEL = { VERBOSE: 'VERBOSE', ERROR: 'ERROR' };
try {
  const RNPurchases = require('react-native-purchases');
  Purchases = RNPurchases.default;
  LOG_LEVEL = RNPurchases.LOG_LEVEL || { VERBOSE: 'VERBOSE', ERROR: 'ERROR' };
  // Test if native module is actually working by calling a simple method
  // If the native module isn't linked, this will throw
  if (Purchases) {
    try {
      // Try to access a property that requires native module
      // If native module is null, methods will fail
      Purchases.setLogLevel(LOG_LEVEL.ERROR);
    } catch (testError) {
      console.warn('[PurchaseService] react-native-purchases native module not working, in-app purchases disabled');
      Purchases = null;
    }
  }
} catch (e) {
  console.warn('[PurchaseService] react-native-purchases not available, in-app purchases disabled');
  Purchases = null;
}

// RevenueCat API keys
const REVENUECAT_API_KEYS = {
  ios: 'appl_dYUYWoTgujFJiMXmAGHvpVgqLAP', // TODO: Replace with production iOS key
  android: 'goog_lgSPiIvpocHRmPfRNoyMxvLIyga',
};

// Product identifiers - these should match your RevenueCat products
export const PRODUCT_IDS = {
  // Activity Packs (non-consumable one-time purchases)
  pack_educational: 'playcompass_pack_educational',
  pack_creative: 'playcompass_pack_creative',
  pack_active: 'playcompass_pack_active',
  pack_games: 'playcompass_pack_games',
  pack_calm: 'playcompass_pack_calm',
  pack_outdoor: 'playcompass_pack_outdoor',
  pack_social: 'playcompass_pack_social',
  pack_music: 'playcompass_pack_music',
  // Premium Lifetime (non-consumable one-time purchase)
  premium_lifetime: 'playcompass_premium_lifetime',
  // Legacy subscription IDs (kept for restore compatibility)
  plus_monthly: 'playcompass_plus_monthly',
  family_monthly: 'playcompass_family_monthly',
};

// Entitlement identifiers in RevenueCat
const ENTITLEMENTS = {
  // Pack entitlements
  pack_educational: 'pack_educational',
  pack_creative: 'pack_creative',
  pack_active: 'pack_active',
  pack_games: 'pack_games',
  pack_calm: 'pack_calm',
  pack_outdoor: 'pack_outdoor',
  pack_social: 'pack_social',
  pack_music: 'pack_music',
  // Premium lifetime entitlement
  premium_lifetime: 'premium_lifetime',
  // Legacy entitlements (for backwards compatibility with old subscribers)
  plus: 'plus',
  family: 'family',
  playcompass_plus: 'playcompass_plus',
  playcompass_family: 'playcompass_family',
};

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called once at app startup
 */
export const initializePurchases = async () => {
  if (!Purchases) {
    console.log('[Purchases] RevenueCat not available (requires development build)');
    return;
  }

  if (isInitialized) {
    console.log('[Purchases] Already initialized');
    return;
  }

  try {
    // Set log level (use DEBUG in development, ERROR in production)
    if (typeof Purchases.setLogLevel === 'function') {
      try {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
      } catch (logError) {
        console.warn('[Purchases] setLogLevel failed, disabling purchases:', logError.message);
        Purchases = null;
        return;
      }
    }

    // Configure with platform-specific API key
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEYS.ios
      : REVENUECAT_API_KEYS.android;

    await Purchases.configure({ apiKey });
    isInitialized = true;
    console.log('[Purchases] RevenueCat initialized successfully');
  } catch (error) {
    console.error('[Purchases] Failed to initialize RevenueCat:', error);
    Purchases = null;
  }
};

/**
 * Set the user ID for RevenueCat (call after authentication)
 * @param {string} userId - Firebase user ID
 */
export const setUserId = async (userId) => {
  if (!Purchases) return;

  try {
    if (!isInitialized) {
      await initializePurchases();
    }
    if (isInitialized) {
      await Purchases.logIn(userId);
      console.log('[Purchases] User ID set:', userId);
    }
  } catch (error) {
    console.error('[Purchases] Failed to set user ID:', error);
  }
};

/**
 * Clear user ID on logout
 */
export const clearUserId = async () => {
  if (!Purchases || !isInitialized) return;

  try {
    await Purchases.logOut();
    console.log('[Purchases] User logged out from RevenueCat');
  } catch (error) {
    console.error('[Purchases] Failed to logout:', error);
  }
};

/**
 * Get available packages/products for purchase
 * @returns {Promise<Array>} Array of available packages
 */
export const getOfferings = async () => {
  if (!Purchases) return [];

  try {
    if (!isInitialized) {
      await initializePurchases();
    }
    if (!isInitialized) return [];

    const offerings = await Purchases.getOfferings();

    if (offerings.current && offerings.current.availablePackages.length > 0) {
      console.log('[Purchases] Available packages:', offerings.current.availablePackages.length);
      return offerings.current.availablePackages;
    }

    console.log('[Purchases] No offerings available');
    return [];
  } catch (error) {
    console.error('[Purchases] Failed to get offerings:', error);
    return [];
  }
};

/**
 * Find a package by product ID from offerings
 * @param {string} productId - Product ID to find
 * @param {Array} offerings - Array of offerings (optional, will fetch if not provided)
 * @returns {Promise<Object|null>} Package or null
 */
export const findPackageByProductId = async (productId, offerings = null) => {
  const packages = offerings || await getOfferings();
  return packages.find((pkg) => pkg.product.identifier === productId) || null;
};

/**
 * Purchase a package
 * @param {Object} pkg - RevenueCat package object
 * @returns {Promise<Object>} Purchase result
 */
export const purchasePackage = async (pkg) => {
  if (!Purchases) {
    return { success: false, error: 'Purchases not available. Rebuild the app to enable.' };
  }

  try {
    if (!isInitialized) {
      await initializePurchases();
    }
    if (!isInitialized) {
      return { success: false, error: 'Purchases not initialized' };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    // Extract owned packs and premium status from customer info
    const { ownedPacks, hasPremiumLifetime } = getOwnedPacksFromCustomerInfo(customerInfo);

    console.log('[Purchases] Purchase successful, ownedPacks:', ownedPacks, 'hasPremiumLifetime:', hasPremiumLifetime);

    return {
      success: true,
      ownedPacks,
      hasPremiumLifetime,
      customerInfo,
    };
  } catch (error) {
    if (error.userCancelled) {
      console.log('[Purchases] User cancelled purchase');
      return { success: false, cancelled: true };
    }
    console.error('[Purchases] Purchase failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Purchase an activity pack by pack ID
 * @param {string} packId - Pack ID (e.g., 'educational', 'creative')
 * @returns {Promise<Object>} Purchase result
 */
export const purchasePack = async (packId) => {
  const pack = ACTIVITY_PACKS[packId];
  if (!pack) {
    return { success: false, error: `Unknown pack: ${packId}` };
  }

  const pkg = await findPackageByProductId(pack.productId);
  if (!pkg) {
    return { success: false, error: `Package not found for ${packId}. Check RevenueCat configuration.` };
  }

  return purchasePackage(pkg);
};

/**
 * Purchase premium lifetime
 * @returns {Promise<Object>} Purchase result
 */
export const purchaseLifetime = async () => {
  const pkg = await findPackageByProductId(PREMIUM_LIFETIME.productId);
  if (!pkg) {
    return { success: false, error: 'Premium Lifetime package not found. Check RevenueCat configuration.' };
  }

  return purchasePackage(pkg);
};

/**
 * Restore previous purchases
 * @returns {Promise<Object>} Restore result
 */
export const restorePurchases = async () => {
  if (!Purchases) {
    return { success: false, ownedPacks: [], hasPremiumLifetime: false, error: 'Purchases not available' };
  }

  try {
    if (!isInitialized) {
      await initializePurchases();
    }
    if (!isInitialized) {
      return { success: false, ownedPacks: [], hasPremiumLifetime: false, error: 'Purchases not initialized' };
    }

    const customerInfo = await Purchases.restorePurchases();
    const { ownedPacks, hasPremiumLifetime } = getOwnedPacksFromCustomerInfo(customerInfo);

    console.log('[Purchases] Purchases restored, ownedPacks:', ownedPacks, 'hasPremiumLifetime:', hasPremiumLifetime);

    return {
      success: true,
      ownedPacks,
      hasPremiumLifetime,
      customerInfo,
    };
  } catch (error) {
    console.error('[Purchases] Restore failed:', error);
    return { success: false, ownedPacks: [], hasPremiumLifetime: false, error: error.message };
  }
};

/**
 * Get current purchase status
 * @returns {Promise<Object>} Current purchase info
 */
export const getPurchaseStatus = async () => {
  if (!Purchases) {
    return { ownedPacks: [], hasPremiumLifetime: false };
  }

  try {
    if (!isInitialized) {
      await initializePurchases();
    }
    if (!isInitialized) {
      return { ownedPacks: [], hasPremiumLifetime: false };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const { ownedPacks, hasPremiumLifetime } = getOwnedPacksFromCustomerInfo(customerInfo);

    return {
      ownedPacks,
      hasPremiumLifetime,
      customerInfo,
    };
  } catch (error) {
    console.error('[Purchases] Failed to get purchase status:', error);
    return { ownedPacks: [], hasPremiumLifetime: false };
  }
};

// Legacy alias for backwards compatibility
export const getSubscriptionStatus = async () => {
  const status = await getPurchaseStatus();
  return {
    ...status,
    tier: status.hasPremiumLifetime ? 'premiumLifetime' : 'free',
    isActive: status.hasPremiumLifetime || status.ownedPacks.length > 0,
  };
};

/**
 * Extract owned packs and premium status from RevenueCat customer info
 * @param {Object} customerInfo - RevenueCat customer info
 * @returns {Object} { ownedPacks: string[], hasPremiumLifetime: boolean }
 */
const getOwnedPacksFromCustomerInfo = (customerInfo) => {
  const activeEntitlements = customerInfo.entitlements.active;
  const ownedPacks = [];
  let hasPremiumLifetime = false;

  // Check for premium lifetime entitlement
  if (
    activeEntitlements[ENTITLEMENTS.premium_lifetime] ||
    // Legacy entitlements that should grant lifetime
    activeEntitlements[ENTITLEMENTS.family] ||
    activeEntitlements[ENTITLEMENTS.playcompass_family]
  ) {
    hasPremiumLifetime = true;
  }

  // Check for legacy plus subscription (grant lifetime as loyalty reward)
  if (
    activeEntitlements[ENTITLEMENTS.plus] ||
    activeEntitlements[ENTITLEMENTS.playcompass_plus]
  ) {
    hasPremiumLifetime = true;
  }

  // Check for individual pack entitlements
  const packEntitlements = [
    { entitlement: ENTITLEMENTS.pack_educational, packId: 'educational' },
    { entitlement: ENTITLEMENTS.pack_creative, packId: 'creative' },
    { entitlement: ENTITLEMENTS.pack_active, packId: 'active' },
    { entitlement: ENTITLEMENTS.pack_games, packId: 'games' },
    { entitlement: ENTITLEMENTS.pack_calm, packId: 'calm' },
    { entitlement: ENTITLEMENTS.pack_outdoor, packId: 'outdoor' },
    { entitlement: ENTITLEMENTS.pack_social, packId: 'social' },
    { entitlement: ENTITLEMENTS.pack_music, packId: 'music' },
  ];

  for (const { entitlement, packId } of packEntitlements) {
    if (activeEntitlements[entitlement]) {
      ownedPacks.push(packId);
    }
  }

  // Also check non-subscription purchases (for non-consumable products)
  const nonSubscriptionTransactions = customerInfo.nonSubscriptionTransactions || [];
  for (const transaction of nonSubscriptionTransactions) {
    const productId = transaction.productIdentifier || transaction.productId;

    // Check if it's a pack product
    const packId = PRODUCT_TO_PACK[productId];
    if (packId && !ownedPacks.includes(packId)) {
      ownedPacks.push(packId);
    }

    // Check if it's premium lifetime
    if (productId === PREMIUM_LIFETIME.productId) {
      hasPremiumLifetime = true;
    }
  }

  return { ownedPacks, hasPremiumLifetime };
};

/**
 * Check if user has premium lifetime
 * @returns {Promise<boolean>}
 */
export const hasPremiumLifetime = async () => {
  const status = await getPurchaseStatus();
  return status.hasPremiumLifetime;
};

/**
 * Check if user owns a specific pack
 * @param {string} packId - Pack ID to check
 * @returns {Promise<boolean>}
 */
export const ownsPack = async (packId) => {
  const status = await getPurchaseStatus();
  return status.hasPremiumLifetime || status.ownedPacks.includes(packId);
};

/**
 * Add listener for customer info updates
 * @param {Function} callback - Called when customer info changes
 * @returns {Function} Unsubscribe function
 */
export const addCustomerInfoListener = (callback) => {
  if (!Purchases || !isInitialized) {
    return () => {};
  }

  const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    const { ownedPacks, hasPremiumLifetime } = getOwnedPacksFromCustomerInfo(customerInfo);
    callback({ ownedPacks, hasPremiumLifetime, customerInfo });
  });

  return () => {
    listener.remove();
  };
};

export default {
  initializePurchases,
  setUserId,
  clearUserId,
  getOfferings,
  findPackageByProductId,
  purchasePackage,
  purchasePack,
  purchaseLifetime,
  restorePurchases,
  getPurchaseStatus,
  getSubscriptionStatus,
  hasPremiumLifetime,
  ownsPack,
  addCustomerInfoListener,
  PRODUCT_IDS,
};
