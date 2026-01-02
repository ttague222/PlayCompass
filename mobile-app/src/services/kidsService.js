/**
 * PlayCompass Kids Service
 *
 * Manages child profiles in Firestore
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { sanitizeInput, isValidKidName, isValidAge, logSecurityEvent } from '../utils/security';

// Generate a unique ID for each kid
const generateKidId = () => {
  return `kid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Age groups for activity matching
export const AGE_GROUPS = {
  TODDLER: { min: 1, max: 3, label: 'Toddler', emoji: '👶' },
  PRESCHOOL: { min: 4, max: 5, label: 'Preschool', emoji: '🧒' },
  EARLY_ELEMENTARY: { min: 6, max: 8, label: 'Early Elementary', emoji: '📚' },
  LATE_ELEMENTARY: { min: 9, max: 11, label: 'Late Elementary', emoji: '🎒' },
  MIDDLE_SCHOOL: { min: 12, max: 14, label: 'Middle School', emoji: '🎓' },
  HIGH_SCHOOL: { min: 15, max: 18, label: 'High School', emoji: '🎯' },
};

// Interest categories
export const INTERESTS = [
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'arts', label: 'Arts & Crafts', emoji: '🎨' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'reading', label: 'Reading', emoji: '📖' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'building', label: 'Building', emoji: '🧱' },
  { id: 'cooking', label: 'Cooking', emoji: '👨‍🍳' },
  { id: 'games', label: 'Games', emoji: '🎮' },
  { id: 'animals', label: 'Animals', emoji: '🐾' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
  { id: 'theater', label: 'Theater', emoji: '🎭' },
];

// Avatar options for kids
export const KID_AVATARS = [
  '👧', '👦', '🧒', '👶', '🦸‍♀️', '🦸‍♂️', '🧚‍♀️', '🧚‍♂️',
  '🦁', '🐰', '🐻', '🦊', '🐼', '🐨', '🐯', '🦄',
];

// Get the user's Firestore document reference
const getUserRef = () => {
  const user = auth().currentUser;
  if (!user) throw new Error('No user signed in');
  return firestore().collection('users').doc(user.uid);
};

/**
 * Add a new child profile
 */
export const addKid = async (kidData) => {
  try {
    // Validate and sanitize input
    const sanitizedName = sanitizeInput(kidData.name);
    if (!isValidKidName(sanitizedName)) {
      logSecurityEvent('invalid_kid_name', { name: sanitizedName });
      return { success: false, error: 'Please enter a valid name (letters, spaces, and hyphens only)' };
    }

    if (!isValidAge(kidData.age)) {
      logSecurityEvent('invalid_kid_age', { age: kidData.age });
      return { success: false, error: 'Please enter a valid age (0-18)' };
    }

    // Validate avatar is in allowed list
    const avatar = KID_AVATARS.includes(kidData.avatar) ? kidData.avatar : '🧒';

    // Validate interests are in allowed list
    const validInterestIds = INTERESTS.map((i) => i.id);
    const interests = (kidData.interests || []).filter((i) => validInterestIds.includes(i));

    const userRef = getUserRef();
    const kid = {
      id: generateKidId(),
      name: sanitizedName,
      age: parseInt(kidData.age, 10),
      avatar,
      interests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use set with merge to handle both new and existing documents
    // This avoids the need for a separate get() call and works atomically
    const userDoc = await userRef.get();

    if (userDoc.exists && userDoc.data()?.kids) {
      // Document exists with kids array, use update with arrayUnion
      await userRef.update({
        kids: firestore.FieldValue.arrayUnion(kid),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Document doesn't exist or has no kids array, use set with merge
      await userRef.set(
        {
          kids: [kid],
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    logSecurityEvent('kid_added', { kidId: kid.id });
    return { success: true, kid };
  } catch (error) {
    console.error('Add kid error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing child profile
 */
export const updateKid = async (kidId, updates) => {
  try {
    // Validate updates
    const sanitizedUpdates = {};

    if (updates.name !== undefined) {
      const sanitizedName = sanitizeInput(updates.name);
      if (!isValidKidName(sanitizedName)) {
        logSecurityEvent('invalid_kid_name_update', { name: sanitizedName });
        return { success: false, error: 'Please enter a valid name' };
      }
      sanitizedUpdates.name = sanitizedName;
    }

    if (updates.age !== undefined) {
      if (!isValidAge(updates.age)) {
        logSecurityEvent('invalid_kid_age_update', { age: updates.age });
        return { success: false, error: 'Please enter a valid age (0-18)' };
      }
      sanitizedUpdates.age = parseInt(updates.age, 10);
    }

    if (updates.avatar !== undefined) {
      sanitizedUpdates.avatar = KID_AVATARS.includes(updates.avatar) ? updates.avatar : undefined;
    }

    if (updates.interests !== undefined) {
      const validInterestIds = INTERESTS.map((i) => i.id);
      sanitizedUpdates.interests = updates.interests.filter((i) => validInterestIds.includes(i));
    }

    const userRef = getUserRef();
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userData?.kids) {
      throw new Error('No kids found');
    }

    const updatedKids = userData.kids.map((kid) => {
      if (kid.id === kidId) {
        return {
          ...kid,
          ...sanitizedUpdates,
          updatedAt: new Date().toISOString(),
        };
      }
      return kid;
    });

    await userRef.update({
      kids: updatedKids,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    logSecurityEvent('kid_updated', { kidId });
    const updatedKid = updatedKids.find((k) => k.id === kidId);
    return { success: true, kid: updatedKid };
  } catch (error) {
    console.error('Update kid error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a child profile
 */
export const removeKid = async (kidId) => {
  try {
    const userRef = getUserRef();
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userData?.kids) {
      throw new Error('No kids found');
    }

    const kidToRemove = userData.kids.find((k) => k.id === kidId);
    if (!kidToRemove) {
      throw new Error('Kid not found');
    }

    await userRef.update({
      kids: firestore.FieldValue.arrayRemove(kidToRemove),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Remove kid error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all kids for the current user
 */
export const getKids = async () => {
  try {
    const userRef = getUserRef();
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    return { success: true, kids: userData?.kids || [] };
  } catch (error) {
    console.error('Get kids error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get age group for a given age
 */
export const getAgeGroup = (age) => {
  for (const [key, group] of Object.entries(AGE_GROUPS)) {
    if (age >= group.min && age <= group.max) {
      return { key, ...group };
    }
  }
  return null;
};

/**
 * Get age groups for multiple kids (for activity filtering)
 */
export const getAgeGroupsForKids = (kids) => {
  const groups = new Set();
  kids.forEach((kid) => {
    const group = getAgeGroup(kid.age);
    if (group) {
      groups.add(group.key);
    }
  });
  return Array.from(groups);
};

/**
 * Get combined interests for multiple kids
 */
export const getCombinedInterests = (kids) => {
  const interests = new Set();
  kids.forEach((kid) => {
    (kid.interests || []).forEach((interest) => {
      interests.add(interest);
    });
  });
  return Array.from(interests);
};

export default {
  addKid,
  updateKid,
  removeKid,
  getKids,
  getAgeGroup,
  getAgeGroupsForKids,
  getCombinedInterests,
  AGE_GROUPS,
  INTERESTS,
  KID_AVATARS,
};
