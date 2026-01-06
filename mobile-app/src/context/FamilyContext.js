/**
 * PlayCompass Family Context
 *
 * Global state for family sharing features
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import familySharingService from '../services/familySharingService';
import { useAuth } from './AuthContext';

const FamilyContext = createContext();

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};

export const FamilyProvider = ({ children }) => {
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);

  // Load family data on mount
  const loadFamily = useCallback(async () => {
    if (!user?.uid) {
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await familySharingService.getUserFamily(user.uid);

      if (result.success && result.family) {
        setFamily(result.family);

        // Load members
        const membersResult = await familySharingService.getFamilyMembers(result.family.id);
        if (membersResult.success) {
          setMembers(membersResult.members);
        }
      } else {
        setFamily(null);
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading family:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Create a new family
  const createFamily = useCallback(
    async (familyName) => {
      if (!user?.uid) return { success: false, error: 'Not authenticated' };

      const result = await familySharingService.createFamily(user.uid, familyName);
      if (result.success) {
        await loadFamily();
      }
      return result;
    },
    [user?.uid, loadFamily]
  );

  // Generate invite code
  const generateInvite = useCallback(async () => {
    if (!user?.uid || !family?.id) return { success: false };

    const result = await familySharingService.generateInviteCode(family.id, user.uid);
    if (result.success) {
      setInviteCode(result.code);
    }
    return result;
  }, [user?.uid, family?.id]);

  // Join family with code
  const joinFamily = useCallback(
    async (code) => {
      if (!user?.uid) return { success: false, error: 'Not authenticated' };

      const result = await familySharingService.joinFamily(user.uid, code);
      if (result.success) {
        await loadFamily();
      }
      return result;
    },
    [user?.uid, loadFamily]
  );

  // Leave family
  const leaveFamily = useCallback(async () => {
    if (!user?.uid || !family?.id) return { success: false };

    const result = await familySharingService.leaveFamily(user.uid, family.id);
    if (result.success) {
      setFamily(null);
      setMembers([]);
    }
    return result;
  }, [user?.uid, family?.id]);

  // Remove member
  const removeMember = useCallback(
    async (memberId) => {
      if (!user?.uid || !family?.id) return { success: false };

      const result = await familySharingService.removeMember(user.uid, family.id, memberId);
      if (result.success) {
        await loadFamily();
      }
      return result;
    },
    [user?.uid, family?.id, loadFamily]
  );

  // Update member role
  const updateMemberRole = useCallback(
    async (memberId, newRole) => {
      if (!user?.uid || !family?.id) return { success: false };

      const result = await familySharingService.updateMemberRole(
        user.uid,
        family.id,
        memberId,
        newRole
      );
      if (result.success) {
        await loadFamily();
      }
      return result;
    },
    [user?.uid, family?.id, loadFamily]
  );

  // Transfer ownership
  const transferOwnership = useCallback(
    async (newOwnerId) => {
      if (!user?.uid || !family?.id) return { success: false };

      const result = await familySharingService.transferOwnership(
        user.uid,
        family.id,
        newOwnerId
      );
      if (result.success) {
        await loadFamily();
      }
      return result;
    },
    [user?.uid, family?.id, loadFamily]
  );

  // Share kid with family
  const shareKid = useCallback(
    async (kidId) => {
      if (!family?.id) return { success: false };

      return familySharingService.shareKidWithFamily(kidId, family.id);
    },
    [family?.id]
  );

  // Delete family
  const deleteFamily = useCallback(async () => {
    if (!user?.uid || !family?.id) return { success: false };

    const result = await familySharingService.deleteFamily(user.uid, family.id);
    if (result.success) {
      setFamily(null);
      setMembers([]);
    }
    return result;
  }, [user?.uid, family?.id]);

  // Check if user is owner
  const isOwner = family?.ownerId === user?.uid;

  // Check if user is admin or owner
  const isAdmin =
    isOwner || members.find((m) => m.id === user?.uid)?.role === 'admin';

  // Get current user's role
  const userRole = members.find((m) => m.id === user?.uid)?.role || null;

  // Load data on mount
  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  const value = {
    family,
    members,
    loading,
    inviteCode,
    isOwner,
    isAdmin,
    userRole,
    hasFamily: !!family,
    createFamily,
    generateInvite,
    joinFamily,
    leaveFamily,
    removeMember,
    updateMemberRole,
    transferOwnership,
    shareKid,
    deleteFamily,
    loadFamily,
  };

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
};

export default FamilyContext;
