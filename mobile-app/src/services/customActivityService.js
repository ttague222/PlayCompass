/**
 * PlayCompass Custom Activity Service
 *
 * Allows users to create, edit, and manage their own custom activities
 * Premium feature available to Plus and Family Pro subscribers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { createActivity } from '../data/activitySchema';

const CUSTOM_ACTIVITIES_KEY = '@playcompass_custom_activities';
const MAX_CUSTOM_ACTIVITIES = 50;

/**
 * Generate a unique ID for custom activities
 */
const generateCustomActivityId = () => {
  return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all custom activities for a user
 */
export const getCustomActivities = async (userId) => {
  try {
    // Try local storage first
    const key = `${CUSTOM_ACTIVITIES_KEY}_${userId}`;
    const stored = await AsyncStorage.getItem(key);

    if (stored) {
      return JSON.parse(stored);
    }

    return [];
  } catch (error) {
    console.error('Error getting custom activities:', error);
    return [];
  }
};

/**
 * Save custom activities to storage
 */
const saveCustomActivities = async (userId, activities) => {
  try {
    const key = `${CUSTOM_ACTIVITIES_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(activities));

    // Also sync to Firestore for backup
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('customActivities')
        .doc('activities')
        .set({ activities, updatedAt: firestore.FieldValue.serverTimestamp() });
    } catch (firestoreError) {
      // Silently fail Firestore sync - local storage is primary
      console.log('Firestore sync skipped:', firestoreError.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving custom activities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new custom activity
 */
export const createCustomActivity = async (userId, activityData) => {
  try {
    const activities = await getCustomActivities(userId);

    // Check limit
    if (activities.length >= MAX_CUSTOM_ACTIVITIES) {
      return {
        success: false,
        error: `Maximum of ${MAX_CUSTOM_ACTIVITIES} custom activities reached`,
      };
    }

    // Validate required fields
    if (!activityData.title || activityData.title.trim().length === 0) {
      return { success: false, error: 'Activity title is required' };
    }

    // Create the activity using the schema
    const newActivity = createActivity({
      id: generateCustomActivityId(),
      title: activityData.title.trim(),
      description: activityData.description?.trim() || '',
      emoji: activityData.emoji || '🎯',
      category: activityData.category || 'creative',
      ageGroups: activityData.ageGroups || ['preschool', 'early_elementary'],
      location: activityData.location || 'both',
      duration: activityData.duration || 'medium',
      energy: activityData.energy || 'medium',
      materials: activityData.materials || 'none',
      participants: activityData.participants || 'any',
      interests: activityData.interests || [],
      tags: [...(activityData.tags || []), 'custom'],
      weather: activityData.weather || 'any',
      season: activityData.season || 'any',
      messLevel: activityData.messLevel || 'none',
      setupTime: activityData.setupTime || 'instant',
      contexts: activityData.contexts || [],
      instructions: activityData.instructions || [],
      tips: activityData.tips || [],
      variations: activityData.variations || [],
      adultSupervision: activityData.adultSupervision || false,
      popularityScore: 50,
    });

    // Add metadata
    newActivity.isCustom = true;
    newActivity.createdBy = userId;
    newActivity.createdAt = new Date().toISOString();
    newActivity.updatedAt = new Date().toISOString();

    activities.push(newActivity);

    const saveResult = await saveCustomActivities(userId, activities);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, activity: newActivity };
  } catch (error) {
    console.error('Error creating custom activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing custom activity
 */
export const updateCustomActivity = async (userId, activityId, updates) => {
  try {
    const activities = await getCustomActivities(userId);
    const index = activities.findIndex((a) => a.id === activityId);

    if (index === -1) {
      return { success: false, error: 'Activity not found' };
    }

    // Validate title if being updated
    if (updates.title !== undefined && updates.title.trim().length === 0) {
      return { success: false, error: 'Activity title cannot be empty' };
    }

    // Update the activity
    const updatedActivity = {
      ...activities[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Preserve system fields
    updatedActivity.id = activityId;
    updatedActivity.isCustom = true;
    updatedActivity.createdBy = activities[index].createdBy;
    updatedActivity.createdAt = activities[index].createdAt;

    // Ensure 'custom' tag is present
    if (!updatedActivity.tags.includes('custom')) {
      updatedActivity.tags.push('custom');
    }

    activities[index] = updatedActivity;

    const saveResult = await saveCustomActivities(userId, activities);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, activity: updatedActivity };
  } catch (error) {
    console.error('Error updating custom activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a custom activity
 */
export const deleteCustomActivity = async (userId, activityId) => {
  try {
    const activities = await getCustomActivities(userId);
    const index = activities.findIndex((a) => a.id === activityId);

    if (index === -1) {
      return { success: false, error: 'Activity not found' };
    }

    const deletedActivity = activities[index];
    activities.splice(index, 1);

    const saveResult = await saveCustomActivities(userId, activities);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, deletedActivity };
  } catch (error) {
    console.error('Error deleting custom activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single custom activity by ID
 */
export const getCustomActivity = async (userId, activityId) => {
  try {
    const activities = await getCustomActivities(userId);
    const activity = activities.find((a) => a.id === activityId);

    if (!activity) {
      return { success: false, error: 'Activity not found' };
    }

    return { success: true, activity };
  } catch (error) {
    console.error('Error getting custom activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Duplicate an existing activity (custom or built-in) as a custom activity
 */
export const duplicateActivity = async (userId, sourceActivity, newTitle = null) => {
  try {
    const activityData = {
      ...sourceActivity,
      title: newTitle || `${sourceActivity.title} (Copy)`,
      tags: [...(sourceActivity.tags || []).filter((t) => t !== 'custom')],
    };

    // Remove system fields
    delete activityData.id;
    delete activityData.isCustom;
    delete activityData.createdBy;
    delete activityData.createdAt;
    delete activityData.updatedAt;

    return await createCustomActivity(userId, activityData);
  } catch (error) {
    console.error('Error duplicating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search custom activities
 */
export const searchCustomActivities = async (userId, query) => {
  try {
    const activities = await getCustomActivities(userId);
    const lowerQuery = query.toLowerCase();

    const results = activities.filter((activity) => {
      return (
        activity.title.toLowerCase().includes(lowerQuery) ||
        activity.description?.toLowerCase().includes(lowerQuery) ||
        activity.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        activity.category?.toLowerCase().includes(lowerQuery)
      );
    });

    return { success: true, activities: results };
  } catch (error) {
    console.error('Error searching custom activities:', error);
    return { success: false, error: error.message, activities: [] };
  }
};

/**
 * Get custom activities by category
 */
export const getCustomActivitiesByCategory = async (userId, category) => {
  try {
    const activities = await getCustomActivities(userId);
    const filtered = activities.filter((a) => a.category === category);

    return { success: true, activities: filtered };
  } catch (error) {
    console.error('Error filtering custom activities:', error);
    return { success: false, error: error.message, activities: [] };
  }
};

/**
 * Export custom activities as JSON (for backup)
 */
export const exportCustomActivities = async (userId) => {
  try {
    const activities = await getCustomActivities(userId);

    return {
      success: true,
      data: {
        version: 1,
        exportedAt: new Date().toISOString(),
        activities,
      },
    };
  } catch (error) {
    console.error('Error exporting custom activities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Import custom activities from JSON backup
 */
export const importCustomActivities = async (userId, importData, mode = 'merge') => {
  try {
    if (!importData.activities || !Array.isArray(importData.activities)) {
      return { success: false, error: 'Invalid import data format' };
    }

    const existing = await getCustomActivities(userId);
    let newActivities;

    if (mode === 'replace') {
      // Replace all existing custom activities
      newActivities = importData.activities.map((a) => ({
        ...a,
        id: generateCustomActivityId(),
        createdBy: userId,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      }));
    } else {
      // Merge: add imported activities with new IDs
      const imported = importData.activities.map((a) => ({
        ...a,
        id: generateCustomActivityId(),
        createdBy: userId,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      }));
      newActivities = [...existing, ...imported];
    }

    // Enforce limit
    if (newActivities.length > MAX_CUSTOM_ACTIVITIES) {
      newActivities = newActivities.slice(0, MAX_CUSTOM_ACTIVITIES);
    }

    const saveResult = await saveCustomActivities(userId, newActivities);
    if (!saveResult.success) {
      return saveResult;
    }

    return {
      success: true,
      imported: newActivities.length - existing.length,
      total: newActivities.length,
    };
  } catch (error) {
    console.error('Error importing custom activities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity templates for quick creation
 */
export const getActivityTemplates = () => [
  {
    id: 'template_art',
    title: 'Art Project',
    emoji: '🎨',
    category: 'creative',
    location: 'indoor',
    duration: 'medium',
    energy: 'low',
    materials: 'craft',
    messLevel: 'messy',
  },
  {
    id: 'template_outdoor_game',
    title: 'Outdoor Game',
    emoji: '🏃',
    category: 'active',
    location: 'outdoor',
    duration: 'short',
    energy: 'high',
    materials: 'none',
    weather: 'sunny',
  },
  {
    id: 'template_learning',
    title: 'Learning Activity',
    emoji: '📚',
    category: 'educational',
    location: 'indoor',
    duration: 'medium',
    energy: 'low',
    materials: 'basic',
  },
  {
    id: 'template_cooking',
    title: 'Cooking Project',
    emoji: '👨‍🍳',
    category: 'creative',
    location: 'indoor',
    duration: 'long',
    energy: 'medium',
    materials: 'kitchen',
    adultSupervision: true,
  },
  {
    id: 'template_music',
    title: 'Music Activity',
    emoji: '🎵',
    category: 'music',
    location: 'both',
    duration: 'short',
    energy: 'medium',
    materials: 'none',
  },
  {
    id: 'template_science',
    title: 'Science Experiment',
    emoji: '🔬',
    category: 'educational',
    location: 'indoor',
    duration: 'medium',
    energy: 'medium',
    materials: 'basic',
    adultSupervision: true,
  },
];

export default {
  getCustomActivities,
  createCustomActivity,
  updateCustomActivity,
  deleteCustomActivity,
  getCustomActivity,
  duplicateActivity,
  searchCustomActivities,
  getCustomActivitiesByCategory,
  exportCustomActivities,
  importCustomActivities,
  getActivityTemplates,
  MAX_CUSTOM_ACTIVITIES,
};
