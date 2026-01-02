/**
 * PlayCompass Cloud Functions
 *
 * - cleanupRecHistory: Auto-deletes recommendation history older than 90 days
 * - deleteUserData: Cleans up all user data when account is deleted
 * - rateLimitCheck: Validates rate limits for API calls
 * - validateSubscription: Server-side subscription tier validation
 * - validateRecommendationLimit: Server-side daily recommendation limits
 * - validateKidLimit: Server-side kid count validation
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { user } = require('firebase-functions/v1/auth'); // 1st gen for auth triggers
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// ============================================
// Subscription Tier Configuration
// Must match mobile app's subscriptionService.js
// ============================================
const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    features: {
      dailyRecommendations: 3,
      maxKids: 2,
      historyDays: 7,
    },
  },
  plus: {
    id: 'plus',
    features: {
      dailyRecommendations: 15,
      maxKids: 5,
      historyDays: 30,
    },
  },
  family: {
    id: 'family',
    features: {
      dailyRecommendations: -1, // unlimited
      maxKids: 10,
      historyDays: 365,
    },
  },
};

// RevenueCat entitlement to tier mapping
const ENTITLEMENT_TO_TIER = {
  plus: 'plus',
  playcompass_plus: 'plus',
  'Watchlight Interactive Pro': 'plus',
  family: 'family',
  playcompass_family: 'family',
  'Watchlight Interactive Family': 'family',
};

// ============================================
// 1. Auto-Delete Stale Recommendation History
// Runs daily, deletes rec_history older than 90 days
// ============================================
exports.cleanupRecHistory = onSchedule('every 24 hours', async (event) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

  console.log(`Cleaning up rec_history older than ${cutoffDate.toISOString()}`);

  try {
    // Query for old records
    const snapshot = await db
      .collection('rec_history')
      .where('shownAt', '<', cutoffDate)
      .limit(500) // Process in batches
      .get();

    if (snapshot.empty) {
      console.log('No stale rec_history found');
      return null;
    }

    // Delete in batches
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} stale rec_history documents`);

    return { deleted: snapshot.size };
  } catch (error) {
    console.error('Error cleaning up rec_history:', error);
    throw error;
  }
});

// ============================================
// 2. Account Deletion Listener
// When a user deletes their account, clean up all their data
// Uses 1st gen auth trigger (2nd gen doesn't support onDelete)
// ============================================
exports.deleteUserData = user().onDelete(async (userRecord) => {
  const userId = userRecord.uid;

  console.log(`Cleaning up data for deleted user: ${userId}`);

  try {
    let deletedCount = 0;

    // Helper function to delete documents in batches (Firestore batch limit is 500)
    const deleteInBatches = async (snapshot) => {
      const batchSize = 500;
      let deleted = 0;

      while (snapshot.docs.length > 0) {
        const batch = db.batch();
        const docsToDelete = snapshot.docs.slice(0, batchSize);

        docsToDelete.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deleted += docsToDelete.length;

        if (docsToDelete.length < batchSize) break;

        // Get next batch
        snapshot = await snapshot.query.startAfter(docsToDelete[docsToDelete.length - 1]).get();
      }

      return deleted;
    };

    // 1. Delete activity_history subcollection under user document
    // Note: The mobile app also tries to delete this, but we do it here as backup
    try {
      const activityHistorySnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('activity_history')
        .get();

      if (!activityHistorySnapshot.empty) {
        const batch = db.batch();
        activityHistorySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCount += activityHistorySnapshot.size;
        console.log(`Deleted ${activityHistorySnapshot.size} activity_history documents`);
      }
    } catch (subError) {
      console.warn('Error deleting activity_history subcollection:', subError);
    }

    // 2. Delete user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.delete();
      deletedCount++;
    }

    // 3. Delete all kids for this user (if using separate collection)
    const kidsSnapshot = await db
      .collection('kids')
      .where('userId', '==', userId)
      .get();

    if (!kidsSnapshot.empty) {
      const batch = db.batch();
      kidsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      deletedCount += kidsSnapshot.size;
    }

    // 4. Delete all recommendation history for this user
    const recHistorySnapshot = await db
      .collection('rec_history')
      .where('userId', '==', userId)
      .get();

    if (!recHistorySnapshot.empty) {
      const batch = db.batch();
      recHistorySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      deletedCount += recHistorySnapshot.size;
    }

    // 5. Delete legacy history collection entries
    const legacyHistorySnapshot = await db
      .collection('history')
      .where('userId', '==', userId)
      .get();

    if (!legacyHistorySnapshot.empty) {
      const batch = db.batch();
      legacyHistorySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      deletedCount += legacyHistorySnapshot.size;
    }

    // 6. Delete any subscription data
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    const subscriptionDoc = await subscriptionRef.get();
    if (subscriptionDoc.exists) {
      await subscriptionRef.delete();
      deletedCount++;
    }

    // 7. Delete rate limit documents for this user
    const rateLimitSnapshot = await db
      .collection('rate_limits')
      .where('userId', '==', userId)
      .get();

    if (!rateLimitSnapshot.empty) {
      const batch = db.batch();
      rateLimitSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      deletedCount += rateLimitSnapshot.size;
    }

    console.log(`Deleted ${deletedCount} documents for user ${userId}`);
    return { success: true, deleted: deletedCount };
  } catch (error) {
    console.error(`Error deleting data for user ${userId}:`, error);
    throw error;
  }
});

// ============================================
// 3. Rate Limiting Function
// Tracks and enforces rate limits per user
// ============================================
const RATE_LIMITS = {
  recommendations: { maxCalls: 20, windowMs: 60000 }, // 20 per minute
  activities: { maxCalls: 30, windowMs: 60000 }, // 30 per minute
  history: { maxCalls: 10, windowMs: 60000 }, // 10 per minute
};

exports.checkRateLimit = onCall(async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { action } = request.data;

  if (!action || !RATE_LIMITS[action]) {
    throw new HttpsError('invalid-argument', 'Invalid action specified');
  }

  const limit = RATE_LIMITS[action];
  const rateLimitRef = db.collection('rate_limits').doc(`${userId}_${action}`);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const now = Date.now();

      if (!doc.exists) {
        // First request, create the document
        transaction.set(rateLimitRef, {
          count: 1,
          windowStart: now,
          userId,
          action,
        });
        return { allowed: true, remaining: limit.maxCalls - 1 };
      }

      const data = doc.data();
      const windowAge = now - data.windowStart;

      if (windowAge > limit.windowMs) {
        // Window expired, reset
        transaction.update(rateLimitRef, {
          count: 1,
          windowStart: now,
        });
        return { allowed: true, remaining: limit.maxCalls - 1 };
      }

      if (data.count >= limit.maxCalls) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((limit.windowMs - windowAge) / 1000);
        return { allowed: false, retryAfter, remaining: 0 };
      }

      // Increment counter
      transaction.update(rateLimitRef, {
        count: FieldValue.increment(1),
      });

      return { allowed: true, remaining: limit.maxCalls - data.count - 1 };
    });

    return result;
  } catch (error) {
    console.error('Rate limit check error:', error);
    throw new HttpsError('internal', 'Error checking rate limit');
  }
});

// ============================================
// 4. Log Recommendation Events (for analytics)
// ============================================
exports.onRecHistoryCreated = onDocumentCreated('rec_history/{docId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  // Log analytics event (could be sent to BigQuery, etc.)
  console.log('Recommendation event:', {
    userId: data.userId,
    activityId: data.activityId,
    action: data.action,
    timestamp: data.shownAt,
  });

  // You could extend this to:
  // - Send to BigQuery for analytics
  // - Update activity popularity scores
  // - Trigger notifications

  return null;
});

// ============================================
// 5. Initialize User Document
// Creates user document when they first sign up
// ============================================
exports.initializeUserDoc = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const userRef = db.collection('users').doc(userId);

  try {
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return { success: true, message: 'User document already exists' };
    }

    // Create initial user document
    await userRef.set({
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      kids: [],
      subscription: {
        tier: 'free',
        startedAt: FieldValue.serverTimestamp(),
      },
    });

    console.log(`Created user document for ${userId}`);
    return { success: true, message: 'User document created' };
  } catch (error) {
    console.error('Error initializing user document:', error);
    throw new HttpsError('internal', 'Error creating user document');
  }
});

// ============================================
// 6. Validate Subscription Tier
// Server-side validation of subscription status
// ============================================
const getUserSubscriptionTier = async (userId) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return 'free';
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription;

    if (!subscription || !subscription.tier) {
      return 'free';
    }

    // Check if subscription has expired
    if (subscription.expiresAt) {
      const expiresAt = subscription.expiresAt.toDate
        ? subscription.expiresAt.toDate()
        : new Date(subscription.expiresAt);

      if (new Date() > expiresAt) {
        // Subscription expired, update to free tier
        await userRef.update({
          'subscription.tier': 'free',
          'subscription.previousTier': subscription.tier,
          'subscription.expiredAt': FieldValue.serverTimestamp(),
        });
        return 'free';
      }
    }

    // Validate tier is a known tier
    if (!SUBSCRIPTION_TIERS[subscription.tier]) {
      return 'free';
    }

    return subscription.tier;
  } catch (error) {
    console.error('Error getting user subscription tier:', error);
    return 'free';
  }
};

exports.validateSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    const tier = await getUserSubscriptionTier(userId);
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    return {
      success: true,
      tier,
      features: tierConfig.features,
    };
  } catch (error) {
    console.error('Error validating subscription:', error);
    throw new HttpsError('internal', 'Error validating subscription');
  }
});

// ============================================
// 7. Validate Daily Recommendation Limit
// Server-side check for recommendation usage
// ============================================
exports.validateRecommendationLimit = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { increment } = request.data || {};

  try {
    const tier = await getUserSubscriptionTier(userId);
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    const dailyLimit = tierConfig.features.dailyRecommendations;

    // Get today's date key (YYYY-MM-DD in UTC)
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.collection('daily_usage').doc(`${userId}_${today}`);

    const result = await db.runTransaction(async (transaction) => {
      const usageDoc = await transaction.get(usageRef);
      let currentUsage = 0;

      if (usageDoc.exists) {
        currentUsage = usageDoc.data().recommendationCount || 0;
      }

      // Unlimited tier check (-1 means unlimited)
      if (dailyLimit === -1) {
        if (increment) {
          if (!usageDoc.exists) {
            transaction.set(usageRef, {
              userId,
              date: today,
              recommendationCount: 1,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            transaction.update(usageRef, {
              recommendationCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }

        return {
          allowed: true,
          used: currentUsage + (increment ? 1 : 0),
          limit: 'unlimited',
          remaining: 'unlimited',
        };
      }

      // Check if limit exceeded
      if (currentUsage >= dailyLimit) {
        return {
          allowed: false,
          used: currentUsage,
          limit: dailyLimit,
          remaining: 0,
          message: `Daily limit of ${dailyLimit} recommendations reached`,
        };
      }

      // Increment usage if requested
      if (increment) {
        if (!usageDoc.exists) {
          transaction.set(usageRef, {
            userId,
            date: today,
            recommendationCount: 1,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          transaction.update(usageRef, {
            recommendationCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        currentUsage += 1;
      }

      return {
        allowed: true,
        used: currentUsage,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - currentUsage),
      };
    });

    return { success: true, ...result };
  } catch (error) {
    console.error('Error validating recommendation limit:', error);
    throw new HttpsError('internal', 'Error checking recommendation limit');
  }
});

// ============================================
// 8. Validate Kid Limit
// Server-side check for number of kids
// ============================================
exports.validateKidLimit = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { action } = request.data || {}; // 'check' or 'add'

  try {
    const tier = await getUserSubscriptionTier(userId);
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    const maxKids = tierConfig.features.maxKids;

    // Get current kid count from user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    let currentKidCount = 0;
    if (userDoc.exists) {
      const userData = userDoc.data();
      currentKidCount = userData?.kids?.length || 0;
    }

    // Check if can add more kids
    const canAdd = currentKidCount < maxKids;
    const remaining = Math.max(0, maxKids - currentKidCount);

    if (action === 'add' && !canAdd) {
      return {
        success: false,
        allowed: false,
        currentCount: currentKidCount,
        limit: maxKids,
        remaining: 0,
        tier,
        message: `Maximum of ${maxKids} children allowed on ${tier} tier`,
      };
    }

    return {
      success: true,
      allowed: canAdd,
      currentCount: currentKidCount,
      limit: maxKids,
      remaining,
      tier,
    };
  } catch (error) {
    console.error('Error validating kid limit:', error);
    throw new HttpsError('internal', 'Error checking kid limit');
  }
});

// ============================================
// 9. Sync Subscription from RevenueCat Webhook
// Called when RevenueCat sends subscription updates
// ============================================
exports.syncRevenueCatSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { entitlements, expiresAt } = request.data || {};

  try {
    let tier = 'free';

    // Determine tier from entitlements
    if (entitlements && typeof entitlements === 'object') {
      for (const entitlementId of Object.keys(entitlements)) {
        const mappedTier = ENTITLEMENT_TO_TIER[entitlementId];
        if (mappedTier) {
          // Prefer higher tier (family > plus > free)
          if (mappedTier === 'family' || (mappedTier === 'plus' && tier === 'free')) {
            tier = mappedTier;
          }
        }
      }
    }

    // Update user subscription
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      'subscription.tier': tier,
      'subscription.source': 'revenuecat',
      'subscription.updatedAt': FieldValue.serverTimestamp(),
      ...(expiresAt && { 'subscription.expiresAt': new Date(expiresAt) }),
    });

    console.log(`Synced RevenueCat subscription for user ${userId}: tier=${tier}`);

    return {
      success: true,
      tier,
      features: SUBSCRIPTION_TIERS[tier].features,
    };
  } catch (error) {
    console.error('Error syncing RevenueCat subscription:', error);
    throw new HttpsError('internal', 'Error syncing subscription');
  }
});

// ============================================
// 10. Cleanup Old Daily Usage Records
// Runs daily, deletes usage records older than 30 days
// ============================================
exports.cleanupDailyUsage = onSchedule('every 24 hours', async (event) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  console.log(`Cleaning up daily_usage older than ${cutoffDateStr}`);

  try {
    const snapshot = await db
      .collection('daily_usage')
      .where('date', '<', cutoffDateStr)
      .limit(500)
      .get();

    if (snapshot.empty) {
      console.log('No stale daily_usage found');
      return null;
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} stale daily_usage documents`);

    return { deleted: snapshot.size };
  } catch (error) {
    console.error('Error cleaning up daily_usage:', error);
    throw error;
  }
});
