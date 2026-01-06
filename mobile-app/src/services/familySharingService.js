/**
 * PlayCompass Family Sharing Service
 *
 * Allows family members to share kids and activity data
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * Create a family group
 */
export const createFamily = async (userId, familyName) => {
  try {
    const familyRef = firestore().collection('families').doc();
    const familyId = familyRef.id;

    await familyRef.set({
      name: familyName,
      ownerId: userId,
      members: [userId],
      memberDetails: {
        [userId]: {
          role: 'owner',
          joinedAt: firestore.FieldValue.serverTimestamp(),
          email: auth().currentUser?.email,
          displayName: auth().currentUser?.displayName || 'Family Owner',
        },
      },
      invites: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update user's family reference
    await firestore().collection('users').doc(userId).update({
      familyId: familyId,
      familyRole: 'owner',
    });

    return { success: true, familyId };
  } catch (error) {
    console.error('Error creating family:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get family details
 */
export const getFamily = async (familyId) => {
  try {
    const doc = await firestore().collection('families').doc(familyId).get();
    if (doc.exists) {
      return { success: true, family: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: 'Family not found' };
  } catch (error) {
    console.error('Error getting family:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's family
 */
export const getUserFamily = async (userId) => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data()?.familyId) {
      return getFamily(userDoc.data().familyId);
    }
    return { success: true, family: null };
  } catch (error) {
    console.error('Error getting user family:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate an invite code
 */
export const generateInviteCode = async (familyId, userId) => {
  try {
    // Verify user is owner or admin
    const familyResult = await getFamily(familyId);
    if (!familyResult.success) return familyResult;

    const family = familyResult.family;
    const memberRole = family.memberDetails?.[userId]?.role;

    if (memberRole !== 'owner' && memberRole !== 'admin') {
      return { success: false, error: 'Only owners and admins can invite members' };
    }

    // Generate a 6-character invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const inviteRef = firestore().collection('familyInvites').doc(code);
    await inviteRef.set({
      familyId,
      familyName: family.name,
      createdBy: userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      expiresAt,
      used: false,
    });

    return { success: true, code, expiresAt };
  } catch (error) {
    console.error('Error generating invite code:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Join family with invite code
 */
export const joinFamily = async (userId, inviteCode) => {
  try {
    const inviteDoc = await firestore()
      .collection('familyInvites')
      .doc(inviteCode.toUpperCase())
      .get();

    if (!inviteDoc.exists) {
      return { success: false, error: 'Invalid invite code' };
    }

    const invite = inviteDoc.data();

    if (invite.used) {
      return { success: false, error: 'This invite code has already been used' };
    }

    if (new Date() > invite.expiresAt.toDate()) {
      return { success: false, error: 'This invite code has expired' };
    }

    const familyId = invite.familyId;

    // Add user to family
    await firestore()
      .collection('families')
      .doc(familyId)
      .update({
        members: firestore.FieldValue.arrayUnion(userId),
        [`memberDetails.${userId}`]: {
          role: 'member',
          joinedAt: firestore.FieldValue.serverTimestamp(),
          email: auth().currentUser?.email,
          displayName: auth().currentUser?.displayName || 'Family Member',
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Update user's family reference
    await firestore().collection('users').doc(userId).update({
      familyId: familyId,
      familyRole: 'member',
    });

    // Mark invite as used
    await inviteDoc.ref.update({ used: true, usedBy: userId });

    return { success: true, familyId };
  } catch (error) {
    console.error('Error joining family:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Leave family
 */
export const leaveFamily = async (userId, familyId) => {
  try {
    const familyResult = await getFamily(familyId);
    if (!familyResult.success) return familyResult;

    const family = familyResult.family;

    // Owner can't leave, must transfer ownership first
    if (family.ownerId === userId) {
      return { success: false, error: 'Owner cannot leave. Transfer ownership first.' };
    }

    // Remove from family
    await firestore()
      .collection('families')
      .doc(familyId)
      .update({
        members: firestore.FieldValue.arrayRemove(userId),
        [`memberDetails.${userId}`]: firestore.FieldValue.delete(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Remove family reference from user
    await firestore().collection('users').doc(userId).update({
      familyId: firestore.FieldValue.delete(),
      familyRole: firestore.FieldValue.delete(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error leaving family:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove member from family (owner/admin only)
 */
export const removeMember = async (requesterId, familyId, memberIdToRemove) => {
  try {
    const familyResult = await getFamily(familyId);
    if (!familyResult.success) return familyResult;

    const family = familyResult.family;
    const requesterRole = family.memberDetails?.[requesterId]?.role;

    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return { success: false, error: 'Only owners and admins can remove members' };
    }

    // Can't remove owner
    if (family.ownerId === memberIdToRemove) {
      return { success: false, error: 'Cannot remove the family owner' };
    }

    // Remove from family
    await firestore()
      .collection('families')
      .doc(familyId)
      .update({
        members: firestore.FieldValue.arrayRemove(memberIdToRemove),
        [`memberDetails.${memberIdToRemove}`]: firestore.FieldValue.delete(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Remove family reference from user
    await firestore().collection('users').doc(memberIdToRemove).update({
      familyId: firestore.FieldValue.delete(),
      familyRole: firestore.FieldValue.delete(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (requesterId, familyId, memberId, newRole) => {
  try {
    const familyResult = await getFamily(familyId);
    if (!familyResult.success) return familyResult;

    const family = familyResult.family;

    // Only owner can change roles
    if (family.ownerId !== requesterId) {
      return { success: false, error: 'Only the owner can change roles' };
    }

    // Can't change owner's role
    if (family.ownerId === memberId) {
      return { success: false, error: "Cannot change owner's role" };
    }

    await firestore()
      .collection('families')
      .doc(familyId)
      .update({
        [`memberDetails.${memberId}.role`]: newRole,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Error updating member role:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Transfer ownership
 */
export const transferOwnership = async (currentOwnerId, familyId, newOwnerId) => {
  try {
    const familyResult = await getFamily(familyId);
    if (!familyResult.success) return familyResult;

    const family = familyResult.family;

    if (family.ownerId !== currentOwnerId) {
      return { success: false, error: 'Only the current owner can transfer ownership' };
    }

    if (!family.members.includes(newOwnerId)) {
      return { success: false, error: 'New owner must be a family member' };
    }

    await firestore()
      .collection('families')
      .doc(familyId)
      .update({
        ownerId: newOwnerId,
        [`memberDetails.${currentOwnerId}.role`]: 'admin',
        [`memberDetails.${newOwnerId}.role`]: 'owner',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Update user records
    await firestore().collection('users').doc(currentOwnerId).update({
      familyRole: 'admin',
    });
    await firestore().collection('users').doc(newOwnerId).update({
      familyRole: 'owner',
    });

    return { success: true };
  } catch (error) {
    console.error('Error transferring ownership:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get family members with details
 */
export const getFamilyMembers = async (familyId) => {
  try {
    const familyResult = await getFamily(familyId);
    if (!familyResult.success) return familyResult;

    const family = familyResult.family;
    const members = [];

    for (const memberId of family.members) {
      const userDoc = await firestore().collection('users').doc(memberId).get();
      const memberDetails = family.memberDetails?.[memberId] || {};

      members.push({
        id: memberId,
        email: memberDetails.email || userDoc.data()?.email,
        displayName: memberDetails.displayName || userDoc.data()?.displayName || 'Unknown',
        role: memberDetails.role || 'member',
        joinedAt: memberDetails.joinedAt,
        isOwner: family.ownerId === memberId,
      });
    }

    return { success: true, members };
  } catch (error) {
    console.error('Error getting family members:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share kid with family
 */
export const shareKidWithFamily = async (kidId, familyId) => {
  try {
    await firestore().collection('kids').doc(kidId).update({
      familyId,
      sharedWithFamily: true,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error sharing kid with family:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get family's shared kids
 */
export const getFamilyKids = async (familyId) => {
  try {
    const snapshot = await firestore()
      .collection('kids')
      .where('familyId', '==', familyId)
      .get();

    const kids = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, kids };
  } catch (error) {
    console.error('Error getting family kids:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get family activity history
 */
export const getFamilyHistory = async (familyId, limit = 50) => {
  try {
    const snapshot = await firestore()
      .collection('activityHistory')
      .where('familyId', '==', familyId)
      .orderBy('completedAt', 'desc')
      .limit(limit)
      .get();

    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, history };
  } catch (error) {
    console.error('Error getting family history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete family (owner only)
 */
export const deleteFamily = async (userId, familyId) => {
  try {
    const familyResult = await getFamily(familyId);
    if (!familyResult.success) return familyResult;

    const family = familyResult.family;

    if (family.ownerId !== userId) {
      return { success: false, error: 'Only the owner can delete the family' };
    }

    // Remove family reference from all members
    for (const memberId of family.members) {
      await firestore().collection('users').doc(memberId).update({
        familyId: firestore.FieldValue.delete(),
        familyRole: firestore.FieldValue.delete(),
      });
    }

    // Delete the family
    await firestore().collection('families').doc(familyId).delete();

    return { success: true };
  } catch (error) {
    console.error('Error deleting family:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createFamily,
  getFamily,
  getUserFamily,
  generateInviteCode,
  joinFamily,
  leaveFamily,
  removeMember,
  updateMemberRole,
  transferOwnership,
  getFamilyMembers,
  shareKidWithFamily,
  getFamilyKids,
  getFamilyHistory,
  deleteFamily,
};
