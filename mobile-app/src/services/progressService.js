/**
 * PlayCompass Progress Tracking Service
 *
 * Tracks activity completion, milestones, and achievements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = '@playcompass_progress';
const ACHIEVEMENTS_KEY = '@playcompass_achievements';
const STREAKS_KEY = '@playcompass_streaks';

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
  // Getting Started
  first_activity: {
    id: 'first_activity',
    name: 'First Steps',
    description: 'Complete your first activity',
    emoji: '🌟',
    category: 'milestone',
    requirement: 1,
  },
  activity_10: {
    id: 'activity_10',
    name: 'Getting Active',
    description: 'Complete 10 activities',
    emoji: '🎯',
    category: 'milestone',
    requirement: 10,
  },
  activity_50: {
    id: 'activity_50',
    name: 'Activity Champion',
    description: 'Complete 50 activities',
    emoji: '🏆',
    category: 'milestone',
    requirement: 50,
  },
  activity_100: {
    id: 'activity_100',
    name: 'Centurion',
    description: 'Complete 100 activities',
    emoji: '💯',
    category: 'milestone',
    requirement: 100,
  },

  // Category Exploration
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Try activities from 5 different categories',
    emoji: '🗺️',
    category: 'exploration',
    requirement: 5,
  },
  master_explorer: {
    id: 'master_explorer',
    name: 'Master Explorer',
    description: 'Try activities from all categories',
    emoji: '🌍',
    category: 'exploration',
    requirement: 8,
  },

  // Streaks
  streak_3: {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Complete activities 3 days in a row',
    emoji: '🔥',
    category: 'streak',
    requirement: 3,
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Complete activities 7 days in a row',
    emoji: '⚡',
    category: 'streak',
    requirement: 7,
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Complete activities 30 days in a row',
    emoji: '👑',
    category: 'streak',
    requirement: 30,
  },

  // Category Specialists
  active_specialist: {
    id: 'active_specialist',
    name: 'Energy Expert',
    description: 'Complete 10 active play activities',
    emoji: '🏃',
    category: 'specialist',
    requirement: { category: 'active', count: 10 },
  },
  creative_specialist: {
    id: 'creative_specialist',
    name: 'Creative Genius',
    description: 'Complete 10 creative activities',
    emoji: '🎨',
    category: 'specialist',
    requirement: { category: 'creative', count: 10 },
  },
  outdoor_specialist: {
    id: 'outdoor_specialist',
    name: 'Nature Lover',
    description: 'Complete 10 outdoor activities',
    emoji: '🌲',
    category: 'specialist',
    requirement: { category: 'outdoor', count: 10 },
  },
  educational_specialist: {
    id: 'educational_specialist',
    name: 'Brain Builder',
    description: 'Complete 10 educational activities',
    emoji: '🧠',
    category: 'specialist',
    requirement: { category: 'educational', count: 10 },
  },

  // Time-based
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 5 activities before 9 AM',
    emoji: '🐦',
    category: 'timing',
    requirement: 5,
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 5 activities after 7 PM',
    emoji: '🦉',
    category: 'timing',
    requirement: 5,
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete 20 activities on weekends',
    emoji: '🎉',
    category: 'timing',
    requirement: 20,
  },

  // Seasonal
  spring_spirit: {
    id: 'spring_spirit',
    name: 'Spring Spirit',
    description: 'Complete 5 spring seasonal activities',
    emoji: '🌸',
    category: 'seasonal',
    requirement: { season: 'spring', count: 5 },
  },
  summer_fun: {
    id: 'summer_fun',
    name: 'Summer Fun',
    description: 'Complete 5 summer seasonal activities',
    emoji: '☀️',
    category: 'seasonal',
    requirement: { season: 'summer', count: 5 },
  },
  fall_festivities: {
    id: 'fall_festivities',
    name: 'Fall Festivities',
    description: 'Complete 5 fall seasonal activities',
    emoji: '🍂',
    category: 'seasonal',
    requirement: { season: 'fall', count: 5 },
  },
  winter_wonderland: {
    id: 'winter_wonderland',
    name: 'Winter Wonderland',
    description: 'Complete 5 winter seasonal activities',
    emoji: '❄️',
    category: 'seasonal',
    requirement: { season: 'winter', count: 5 },
  },

  // Special
  variety_pack: {
    id: 'variety_pack',
    name: 'Variety Pack',
    description: 'Complete 3 different activities in one day',
    emoji: '🎲',
    category: 'special',
    requirement: 3,
  },
  family_time: {
    id: 'family_time',
    name: 'Family Time',
    description: 'Complete activities with 3+ kids together',
    emoji: '👨‍👩‍👧‍👦',
    category: 'special',
    requirement: 1,
  },
  five_star: {
    id: 'five_star',
    name: 'Five Star',
    description: 'Rate 10 activities with 5 stars',
    emoji: '⭐',
    category: 'special',
    requirement: 10,
  },
};

/**
 * Get progress data
 */
export const getProgress = async () => {
  try {
    const stored = await AsyncStorage.getItem(PROGRESS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      totalActivities: 0,
      activitiesByCategory: {},
      activitiesBySeason: {},
      activitiesByTimeOfDay: { morning: 0, afternoon: 0, evening: 0 },
      weekendActivities: 0,
      uniqueCategories: [],
      activitiesPerDay: {},
      fiveStarRatings: 0,
      familyActivities: 0,
      lastActivityDate: null,
    };
  } catch (error) {
    console.error('Error getting progress:', error);
    return null;
  }
};

/**
 * Save progress data
 */
export const saveProgress = async (progress) => {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return { success: true };
  } catch (error) {
    console.error('Error saving progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get earned achievements
 */
export const getAchievements = async () => {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

/**
 * Save earned achievements
 */
export const saveAchievements = async (achievements) => {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    return { success: true };
  } catch (error) {
    console.error('Error saving achievements:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get streak data
 */
export const getStreaks = async () => {
  try {
    const stored = await AsyncStorage.getItem(STREAKS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    };
  } catch (error) {
    console.error('Error getting streaks:', error);
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }
};

/**
 * Save streak data
 */
export const saveStreaks = async (streaks) => {
  try {
    await AsyncStorage.setItem(STREAKS_KEY, JSON.stringify(streaks));
    return { success: true };
  } catch (error) {
    console.error('Error saving streaks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record activity completion and check for new achievements
 */
export const recordActivityCompletion = async (activity, kidCount = 1, rating = null) => {
  try {
    const progress = await getProgress();
    const streaks = await getStreaks();
    const earnedAchievements = await getAchievements();

    const now = new Date();
    const today = now.toDateString();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Update total
    progress.totalActivities += 1;

    // Update category counts
    const category = activity.category?.toLowerCase();
    if (category) {
      progress.activitiesByCategory[category] = (progress.activitiesByCategory[category] || 0) + 1;
      if (!progress.uniqueCategories.includes(category)) {
        progress.uniqueCategories.push(category);
      }
    }

    // Update season counts
    const season = activity.season;
    if (season && season !== 'any') {
      progress.activitiesBySeason[season] = (progress.activitiesBySeason[season] || 0) + 1;
    }

    // Update time of day
    if (hour < 9) {
      progress.activitiesByTimeOfDay.morning += 1;
    } else if (hour < 19) {
      progress.activitiesByTimeOfDay.afternoon += 1;
    } else {
      progress.activitiesByTimeOfDay.evening += 1;
    }

    // Update weekend activities
    if (isWeekend) {
      progress.weekendActivities += 1;
    }

    // Update activities per day
    progress.activitiesPerDay[today] = (progress.activitiesPerDay[today] || 0) + 1;

    // Update family activities (3+ kids)
    if (kidCount >= 3) {
      progress.familyActivities += 1;
    }

    // Update 5-star ratings
    if (rating === 5) {
      progress.fiveStarRatings += 1;
    }

    // Update streak
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    if (streaks.lastActivityDate === today) {
      // Already recorded activity today, no streak change
    } else if (streaks.lastActivityDate === yesterdayString) {
      // Continuing streak
      streaks.currentStreak += 1;
      if (streaks.currentStreak > streaks.longestStreak) {
        streaks.longestStreak = streaks.currentStreak;
      }
    } else {
      // Streak broken, start new
      streaks.currentStreak = 1;
    }
    streaks.lastActivityDate = today;
    progress.lastActivityDate = today;

    // Save updated data
    await saveProgress(progress);
    await saveStreaks(streaks);

    // Check for new achievements
    const newAchievements = await checkForNewAchievements(progress, streaks, earnedAchievements);

    return {
      success: true,
      progress,
      streaks,
      newAchievements,
    };
  } catch (error) {
    console.error('Error recording activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check for newly earned achievements
 */
export const checkForNewAchievements = async (progress, streaks, earnedAchievements) => {
  const newlyEarned = [];
  const earnedIds = earnedAchievements.map((a) => a.id);

  // Milestone achievements
  if (progress.totalActivities >= 1 && !earnedIds.includes('first_activity')) {
    newlyEarned.push({ ...ACHIEVEMENTS.first_activity, earnedAt: new Date().toISOString() });
  }
  if (progress.totalActivities >= 10 && !earnedIds.includes('activity_10')) {
    newlyEarned.push({ ...ACHIEVEMENTS.activity_10, earnedAt: new Date().toISOString() });
  }
  if (progress.totalActivities >= 50 && !earnedIds.includes('activity_50')) {
    newlyEarned.push({ ...ACHIEVEMENTS.activity_50, earnedAt: new Date().toISOString() });
  }
  if (progress.totalActivities >= 100 && !earnedIds.includes('activity_100')) {
    newlyEarned.push({ ...ACHIEVEMENTS.activity_100, earnedAt: new Date().toISOString() });
  }

  // Exploration achievements
  if (progress.uniqueCategories.length >= 5 && !earnedIds.includes('explorer')) {
    newlyEarned.push({ ...ACHIEVEMENTS.explorer, earnedAt: new Date().toISOString() });
  }
  if (progress.uniqueCategories.length >= 8 && !earnedIds.includes('master_explorer')) {
    newlyEarned.push({ ...ACHIEVEMENTS.master_explorer, earnedAt: new Date().toISOString() });
  }

  // Streak achievements
  if (streaks.currentStreak >= 3 && !earnedIds.includes('streak_3')) {
    newlyEarned.push({ ...ACHIEVEMENTS.streak_3, earnedAt: new Date().toISOString() });
  }
  if (streaks.currentStreak >= 7 && !earnedIds.includes('streak_7')) {
    newlyEarned.push({ ...ACHIEVEMENTS.streak_7, earnedAt: new Date().toISOString() });
  }
  if (streaks.currentStreak >= 30 && !earnedIds.includes('streak_30')) {
    newlyEarned.push({ ...ACHIEVEMENTS.streak_30, earnedAt: new Date().toISOString() });
  }

  // Category specialist achievements
  if ((progress.activitiesByCategory.active || 0) >= 10 && !earnedIds.includes('active_specialist')) {
    newlyEarned.push({ ...ACHIEVEMENTS.active_specialist, earnedAt: new Date().toISOString() });
  }
  if ((progress.activitiesByCategory.creative || 0) >= 10 && !earnedIds.includes('creative_specialist')) {
    newlyEarned.push({ ...ACHIEVEMENTS.creative_specialist, earnedAt: new Date().toISOString() });
  }
  if ((progress.activitiesByCategory.outdoor || 0) >= 10 && !earnedIds.includes('outdoor_specialist')) {
    newlyEarned.push({ ...ACHIEVEMENTS.outdoor_specialist, earnedAt: new Date().toISOString() });
  }
  if ((progress.activitiesByCategory.educational || 0) >= 10 && !earnedIds.includes('educational_specialist')) {
    newlyEarned.push({ ...ACHIEVEMENTS.educational_specialist, earnedAt: new Date().toISOString() });
  }

  // Time-based achievements
  if (progress.activitiesByTimeOfDay.morning >= 5 && !earnedIds.includes('early_bird')) {
    newlyEarned.push({ ...ACHIEVEMENTS.early_bird, earnedAt: new Date().toISOString() });
  }
  if (progress.activitiesByTimeOfDay.evening >= 5 && !earnedIds.includes('night_owl')) {
    newlyEarned.push({ ...ACHIEVEMENTS.night_owl, earnedAt: new Date().toISOString() });
  }
  if (progress.weekendActivities >= 20 && !earnedIds.includes('weekend_warrior')) {
    newlyEarned.push({ ...ACHIEVEMENTS.weekend_warrior, earnedAt: new Date().toISOString() });
  }

  // Seasonal achievements
  if ((progress.activitiesBySeason.spring || 0) >= 5 && !earnedIds.includes('spring_spirit')) {
    newlyEarned.push({ ...ACHIEVEMENTS.spring_spirit, earnedAt: new Date().toISOString() });
  }
  if ((progress.activitiesBySeason.summer || 0) >= 5 && !earnedIds.includes('summer_fun')) {
    newlyEarned.push({ ...ACHIEVEMENTS.summer_fun, earnedAt: new Date().toISOString() });
  }
  if ((progress.activitiesBySeason.fall || 0) >= 5 && !earnedIds.includes('fall_festivities')) {
    newlyEarned.push({ ...ACHIEVEMENTS.fall_festivities, earnedAt: new Date().toISOString() });
  }
  if ((progress.activitiesBySeason.winter || 0) >= 5 && !earnedIds.includes('winter_wonderland')) {
    newlyEarned.push({ ...ACHIEVEMENTS.winter_wonderland, earnedAt: new Date().toISOString() });
  }

  // Special achievements
  const today = new Date().toDateString();
  if ((progress.activitiesPerDay[today] || 0) >= 3 && !earnedIds.includes('variety_pack')) {
    newlyEarned.push({ ...ACHIEVEMENTS.variety_pack, earnedAt: new Date().toISOString() });
  }
  if (progress.familyActivities >= 1 && !earnedIds.includes('family_time')) {
    newlyEarned.push({ ...ACHIEVEMENTS.family_time, earnedAt: new Date().toISOString() });
  }
  if (progress.fiveStarRatings >= 10 && !earnedIds.includes('five_star')) {
    newlyEarned.push({ ...ACHIEVEMENTS.five_star, earnedAt: new Date().toISOString() });
  }

  // Save new achievements
  if (newlyEarned.length > 0) {
    const allAchievements = [...earnedAchievements, ...newlyEarned];
    await saveAchievements(allAchievements);
  }

  return newlyEarned;
};

/**
 * Get progress summary for display
 */
export const getProgressSummary = async () => {
  const progress = await getProgress();
  const streaks = await getStreaks();
  const achievements = await getAchievements();

  return {
    totalActivities: progress.totalActivities,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    categoriesExplored: progress.uniqueCategories.length,
    achievementsEarned: achievements.length,
    totalAchievements: Object.keys(ACHIEVEMENTS).length,
    topCategory: getTopCategory(progress.activitiesByCategory),
    recentAchievements: achievements.slice(-3),
  };
};

/**
 * Get the most played category
 */
const getTopCategory = (categoryCounts) => {
  let topCategory = null;
  let maxCount = 0;

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = category;
    }
  }

  return topCategory;
};

/**
 * Get monthly activity report
 */
export const getMonthlyReport = async (year, month) => {
  const progress = await getProgress();
  const streaks = await getStreaks();

  // Filter activities for the specified month
  const monthActivities = {};
  let monthTotal = 0;

  for (const [dateString, count] of Object.entries(progress.activitiesPerDay)) {
    const date = new Date(dateString);
    if (date.getFullYear() === year && date.getMonth() === month) {
      monthActivities[dateString] = count;
      monthTotal += count;
    }
  }

  // Calculate days active
  const daysActive = Object.keys(monthActivities).length;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    year,
    month,
    totalActivities: monthTotal,
    daysActive,
    daysInMonth,
    activityRate: Math.round((daysActive / daysInMonth) * 100),
    averagePerDay: daysActive > 0 ? (monthTotal / daysActive).toFixed(1) : 0,
    activitiesPerDay: monthActivities,
    categoryCounts: progress.activitiesByCategory,
  };
};

export default {
  ACHIEVEMENTS,
  getProgress,
  saveProgress,
  getAchievements,
  saveAchievements,
  getStreaks,
  saveStreaks,
  recordActivityCompletion,
  checkForNewAchievements,
  getProgressSummary,
  getMonthlyReport,
};
