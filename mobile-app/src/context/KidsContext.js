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
  const { kids: authKids, userProfile } = useAuth();
  const { checkCanAddKid, tierConfig } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use kids from auth context (real-time synced)
  const kids = authKids || [];

  // Add a new kid
  const addKid = useCallback(async (kidData) => {
    setLoading(true);
    setError(null);
    const result = await serviceAddKid(kidData);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

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
    const ages = kids.map((k) => k.age);
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
