/**
 * PlayCompass Kids Context
 *
 * Manages child profiles state and operations
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  addKid as serviceAddKid,
  updateKid as serviceUpdateKid,
  removeKid as serviceRemoveKid,
  getAgeGroup,
  getAgeGroupsForKids,
  getCombinedInterests,
  AGE_GROUPS,
  INTERESTS,
  KID_AVATARS,
} from '../services/kidsService';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';

const KidsContext = createContext(null);

export const KidsProvider = ({ children }) => {
  const { kids: authKids, userProfile, setKidsLocally } = useAuth();
  const { checkCanAddKid, tierConfig } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use kids from auth context (updated locally, no real-time listener)
  const kids = authKids || [];

  // Add a new kid - simple flow, no listener management needed
  const addKid = useCallback(async (kidData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await serviceAddKid(kidData);

      if (result.success && result.allKids) {
        // Update local state - no real-time listener to worry about
        console.log('[KidsContext] Setting kids locally:', result.allKids.length);
        setKidsLocally(result.allKids);
      } else if (!result.success) {
        setError(result.error);
      }

      setLoading(false);
      return result;
    } catch (err) {
      console.error('[KidsContext] Error adding kid:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [setKidsLocally]);

  // Update a kid
  const updateKid = useCallback(async (kidId, updates) => {
    setLoading(true);
    setError(null);
    const result = await serviceUpdateKid(kidId, updates);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  // Remove a kid
  const removeKid = useCallback(async (kidId) => {
    setLoading(true);
    setError(null);
    const result = await serviceRemoveKid(kidId);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get a single kid by ID
  const getKidById = useCallback(
    (kidId) => {
      return kids.find((kid) => kid.id === kidId) || null;
    },
    [kids]
  );

  // Check if user can add more kids (based on subscription tier)
  const kidLimitInfo = useMemo(() => {
    return checkCanAddKid(kids.length);
  }, [kids.length, checkCanAddKid]);

  const canAddKid = kidLimitInfo.allowed;
  const maxKids = kidLimitInfo.limit;
  const kidsRemaining = kidLimitInfo.remaining;

  // Get age groups for all kids
  const ageGroups = getAgeGroupsForKids(kids);

  // Get combined interests
  const combinedInterests = getCombinedInterests(kids);

  // Get age range string (e.g., "3-8 years")
  const getAgeRangeString = useCallback(() => {
    if (kids.length === 0) return null;
    // Filter to only valid numeric ages to prevent NaN issues
    const ages = kids
      .map((k) => k.age)
      .filter((age) => typeof age === 'number' && !isNaN(age));
    if (ages.length === 0) return null;
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    if (minAge === maxAge) return `${minAge} years`;
    return `${minAge}-${maxAge} years`;
  }, [kids]);

  const value = {
    // State
    kids,
    loading,
    error,

    // Computed
    kidsCount: kids.length,
    hasKids: kids.length > 0,
    canAddKid,
    maxKids,
    kidsRemaining,
    kidLimitInfo,
    ageGroups,
    combinedInterests,

    // Methods
    addKid,
    updateKid,
    removeKid,
    clearError,
    getKidById,
    getAgeRangeString,

    // Helpers
    getAgeGroup,

    // Constants
    AGE_GROUPS,
    INTERESTS,
    KID_AVATARS,
  };

  return (
    <KidsContext.Provider value={value}>
      {children}
    </KidsContext.Provider>
  );
};

export const useKids = () => {
  const context = useContext(KidsContext);
  if (!context) {
    throw new Error('useKids must be used within a KidsProvider');
  }
  return context;
};

export default KidsContext;
