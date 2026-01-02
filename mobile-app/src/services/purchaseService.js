/**
 * PlayCompass Purchase Service
 *
 * Handles in-app purchases via RevenueCat
 */

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// RevenueCat API keys
const REVENUECAT_API_KEYS = {
  ios: 'test_ycTHGMubpEaTHbnahLzhPoiHAgK',
  android: 'test_ycTHGMubpEaTHbnahLzhPoiHAgK',
};

// Product identifiers - these should match your RevenueCat products
export const PRODUCT_IDS = {
  plus_monthly: 'playcompass_plus_monthly',
  family_monthly: 'playcompass_family_monthly',
};

// Map RevenueCat product IDs to our tier names
const PRODUCT_TO_TIER = {
  [PRODUCT_IDS.plus_monthly]: 'plus',
  [PRODUCT_IDS.family_monthly]: 'family',
};

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called once at app startup
 */
export const initializePurchases = async () => {
  if (isInitialized) {
    console.log('[Purchases] Already initialized');
    return;
  }

  try {
    // Set log level (use DEBUG in development, ERROR in production)
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);

    // Configure with platform-specific API key
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEYS.ios
      : REVENUECAT_API_KEYS.android;

    await Purchases.configure({ apiKey });
    isInitialized = true;
    console.log('[Purchases] RevenueCat initialized successfully');
  } catch (error) {
    console.error('[Purchases] Failed to initialize RevenueCat:', error);
    throw error;
  }
};

/**
 * Set the user ID for RevenueCat (call after authentication)
 * @param {string} userId - Firebase user ID
 */
export const setUserId = async (userId) => {
  try {
    if (!isInitialized) {
      await initializePurchases();
    }
    await Purchases.logIn(userId);
    console.log('[Purchases] User ID set:', userId);
  } catch (error) {
    console.error('[Purchases] Failed to set user ID:', error);
  }
};

/**
 * Clear user ID on logout
 */
export const clearUserId = async () => {
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
  try {
    if (!isInitialized) {
      await initializePurchases();
    }

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
 * Purchase a package
 * @param {Object} pkg - RevenueCat package object
 * @returns {Promise<Object>} Purchase result
 */
export const purchasePackage = async (pkg) => {
  try {
    if (!isInitialized) {
      await initializePurchases();
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    // Determine which tier was purchased
    const tier = getTierFromCustomerInfo(customerInfo);

    console.log('[Purchases] Purchase successful, tier:', tier);

    return {
      success: true,
      tier,
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
 * Restore previous purchases
 * @returns {Promise<Object>} Restore result
 */
export const restorePurchases = async () => {
  try {
    if (!isInitialized) {
      await initializePurchases();
    }

    const customerInfo = await Purchases.restorePurchases();
    const tier = getTierFromCustomerInfo(customerInfo);

    console.log('[Purchases] Purchases restored, tier:', tier);

    return {
      success: true,
      tier,
      customerInfo,
    };
  } catch (error) {
    console.error('[Purchases] Restore failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current subscription status
 * @returns {Promise<Object>} Current subscription info
 */
export const getSubscriptionStatus = async () => {
  try {
    if (!isInitialized) {
      await initializePurchases();
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const tier = getTierFromCustomerInfo(customerInfo);

    // Get expiration date and trial info if subscribed
    let expiresAt = null;
    let isTrialPeriod = false;
    let trialEndsAt = null;

    if (tier !== 'free') {
      const entitlements = customerInfo.entitlements.active;
      const entitlement = Object.values(entitlements)[0];
      if (entitlement) {
        if (entitlement.expirationDate) {
          expiresAt = new Date(entitlement.expirationDate);
        }
        // Check if currently in trial period
        if (entitlement.periodType === 'trial') {
          isTrialPeriod = true;
          trialEndsAt = expiresAt;
        }
      }
    }

    return {
      tier,
      isActive: tier !== 'free',
      expiresAt,
      isTrialPeriod,
      trialEndsAt,
      customerInfo,
    };
  } catch (error) {
    console.error('[Purchases] Failed to get subscription status:', error);
    return { tier: 'free', isActive: false, isTrialPeriod: false };
  }
};

/**
 * Determine tier from RevenueCat customer info
 * @param {Object} customerInfo - RevenueCat customer info
 * @returns {string} Tier name ('free', 'plus', or 'family')
 */
const getTierFromCustomerInfo = (customerInfo) => {
  const activeEntitlements = customerInfo.entitlements.active;

  // Check for family tier first (higher tier)
  if (
    activeEntitlements['family'] ||
    activeEntitlements['playcompass_family'] ||
    activeEntitlements['Watchlight Interactive Family']
  ) {
    return 'family';
  }

  // Check for plus tier - includes "Watchlight Interactive Pro" entitlement
  if (
    activeEntitlements['plus'] ||
    activeEntitlements['playcompass_plus'] ||
    activeEntitlements['Watchlight Interactive Pro']
  ) {
    return 'plus';
  }

  // Default to free
  return 'free';
};

/**
 * Check if user has an active subscription
 * @returns {Promise<boolean>}
 */
export const hasActiveSubscription = async () => {
  const status = await getSubscriptionStatus();
  return status.isActive;
};

/**
 * Add listener for customer info updates
 * @param {Function} callback - Called when customer info changes
 * @returns {Function} Unsubscribe function
 */
export const addCustomerInfoListener = (callback) => {
  const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    const tier = getTierFromCustomerInfo(customerInfo);
    callback({ tier, customerInfo });
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
  purchasePackage,
  restorePurchases,
  getSubscriptionStatus,
  hasActiveSubscription,
  addCustomerInfoListener,
  PRODUCT_IDS,
};
