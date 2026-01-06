/**
 * PlayCompass Social Service
 *
 * Handles sharing activities on social media and with friends
 */

import { Share, Platform, Linking as RNLinking } from 'react-native';

// Try to use expo-linking if available, fall back to React Native's Linking
let Linking = RNLinking;
try {
  Linking = require('expo-linking');
} catch (e) {
  console.warn('[SocialService] expo-linking not available, using React Native Linking');
}

/**
 * Generate shareable activity text
 */
const generateShareText = (activity, options = {}) => {
  const { includeApp = true, includeEmoji = true } = options;

  let text = '';

  if (includeEmoji) {
    text += `${getActivityEmoji(activity.category)} `;
  }

  text += `Check out this fun activity: "${activity.name}"`;

  if (activity.description) {
    text += `\n\n${activity.description.substring(0, 100)}${activity.description.length > 100 ? '...' : ''}`;
  }

  if (activity.duration) {
    text += `\n\n⏱️ Takes about ${activity.duration} minutes`;
  }

  if (activity.ageRange) {
    text += `\n👶 Great for ages ${activity.ageRange}`;
  }

  if (includeApp) {
    text += '\n\n📲 Discover more activities on PlayCompass!';
  }

  return text;
};

/**
 * Get emoji for activity category
 */
const getActivityEmoji = (category) => {
  const emojiMap = {
    creative: '🎨',
    physical: '⚽',
    educational: '📚',
    outdoor: '🌳',
    indoor: '🏠',
    social: '👥',
    cooking: '👨‍🍳',
    music: '🎵',
    science: '🔬',
    nature: '🌿',
    games: '🎮',
  };
  return emojiMap[category?.toLowerCase()] || '🎯';
};

/**
 * Share activity via native share sheet
 */
export const shareActivity = async (activity, options = {}) => {
  try {
    const message = generateShareText(activity, options);

    const result = await Share.share(
      {
        message,
        title: activity.name,
      },
      {
        dialogTitle: `Share "${activity.name}"`,
        subject: `Check out this activity: ${activity.name}`,
      }
    );

    if (result.action === Share.sharedAction) {
      return {
        success: true,
        shared: true,
        platform: result.activityType || 'unknown',
      };
    } else if (result.action === Share.dismissedAction) {
      return { success: true, shared: false, dismissed: true };
    }

    return { success: true, shared: false };
  } catch (error) {
    console.error('Error sharing activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share activity to specific platform
 */
export const shareToplatform = async (activity, platform) => {
  const text = encodeURIComponent(generateShareText(activity));
  const title = encodeURIComponent(activity.name);

  let url = '';

  switch (platform) {
    case 'twitter':
    case 'x':
      url = `https://twitter.com/intent/tweet?text=${text}`;
      break;
    case 'facebook':
      url = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
      break;
    case 'whatsapp':
      url = `whatsapp://send?text=${text}`;
      break;
    case 'telegram':
      url = `https://t.me/share/url?text=${text}`;
      break;
    case 'sms':
      url = Platform.select({
        ios: `sms:&body=${text}`,
        android: `sms:?body=${text}`,
      });
      break;
    case 'email':
      url = `mailto:?subject=${title}&body=${text}`;
      break;
    default:
      return shareActivity(activity);
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return { success: true, platform };
    } else {
      // Fall back to native share
      return shareActivity(activity);
    }
  } catch (error) {
    console.error(`Error sharing to ${platform}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Share completed activity with photo
 */
export const shareCompletedActivity = async (activity, photoUri = null, kidName = null) => {
  try {
    let message = '';

    if (kidName) {
      message += `${kidName} just completed "${activity.name}"! `;
    } else {
      message += `We just completed "${activity.name}"! `;
    }

    message += `${getActivityEmoji(activity.category)}\n\n`;

    if (activity.description) {
      message += `${activity.description.substring(0, 80)}...\n\n`;
    }

    message += '📲 Find more activities on PlayCompass!';

    const shareOptions = {
      message,
      title: 'Activity Completed!',
    };

    // Note: For photo sharing, we'd need to use a library like react-native-share
    // which supports sharing images. For now, we just share text.
    const result = await Share.share(shareOptions);

    return {
      success: result.action === Share.sharedAction,
      platform: result.activityType,
    };
  } catch (error) {
    console.error('Error sharing completed activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share activity list/collection
 */
export const shareActivityList = async (activities, listName = 'My Activities') => {
  try {
    let message = `📋 ${listName}\n\n`;

    activities.slice(0, 5).forEach((activity, index) => {
      message += `${index + 1}. ${getActivityEmoji(activity.category)} ${activity.name}`;
      if (activity.duration) {
        message += ` (${activity.duration} min)`;
      }
      message += '\n';
    });

    if (activities.length > 5) {
      message += `\n...and ${activities.length - 5} more!\n`;
    }

    message += '\n📲 Discover activities on PlayCompass!';

    const result = await Share.share({
      message,
      title: listName,
    });

    return {
      success: result.action === Share.sharedAction,
      platform: result.activityType,
    };
  } catch (error) {
    console.error('Error sharing activity list:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share achievement
 */
export const shareAchievement = async (achievement) => {
  try {
    let message = `🏆 Achievement Unlocked!\n\n`;
    message += `${achievement.icon} ${achievement.name}\n\n`;
    message += `${achievement.description}\n\n`;
    message += '📲 Earn achievements on PlayCompass!';

    const result = await Share.share({
      message,
      title: `Achievement: ${achievement.name}`,
    });

    return {
      success: result.action === Share.sharedAction,
      platform: result.activityType,
    };
  } catch (error) {
    console.error('Error sharing achievement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share weekly summary
 */
export const shareWeeklySummary = async (summary) => {
  try {
    let message = `📊 Weekly Activity Summary\n\n`;
    message += `🎯 Activities completed: ${summary.activitiesCompleted}\n`;
    message += `⏱️ Total time: ${summary.totalMinutes} minutes\n`;
    message += `🔥 Current streak: ${summary.streak} days\n`;

    if (summary.favoriteCategory) {
      message += `❤️ Favorite category: ${summary.favoriteCategory}\n`;
    }

    if (summary.newAchievements > 0) {
      message += `🏆 New achievements: ${summary.newAchievements}\n`;
    }

    message += '\n📲 Track your family activities with PlayCompass!';

    const result = await Share.share({
      message,
      title: 'Weekly Summary',
    });

    return {
      success: result.action === Share.sharedAction,
      platform: result.activityType,
    };
  } catch (error) {
    console.error('Error sharing weekly summary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Copy activity link to clipboard
 */
export const copyActivityLink = async (activity) => {
  // In a real app, this would generate a deep link
  // For now, we just return the activity details
  const text = generateShareText(activity, { includeApp: true });

  // Would use Clipboard.setString(text) from @react-native-clipboard/clipboard
  return { success: true, text };
};

/**
 * Available share platforms
 */
export const SHARE_PLATFORMS = [
  { id: 'native', name: 'Share', icon: '📤' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦' },
  { id: 'facebook', name: 'Facebook', icon: '👤' },
  { id: 'telegram', name: 'Telegram', icon: '✈️' },
  { id: 'sms', name: 'Message', icon: '💬' },
  { id: 'email', name: 'Email', icon: '📧' },
];

export default {
  shareActivity,
  shareToplatform,
  shareCompletedActivity,
  shareActivityList,
  shareAchievement,
  shareWeeklySummary,
  copyActivityLink,
  SHARE_PLATFORMS,
};
