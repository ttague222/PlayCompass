/**
 * PlayCompass Activity Schema & Constants
 *
 * Defines the structure for activities and filtering options
 */

// Age groups that match kidsService
export const AGE_GROUPS = {
  TODDLER: { id: 'toddler', min: 1, max: 3, label: 'Toddler', emoji: '👶' },
  PRESCHOOL: { id: 'preschool', min: 4, max: 5, label: 'Preschool', emoji: '🧒' },
  EARLY_ELEMENTARY: { id: 'early_elementary', min: 6, max: 8, label: 'Early Elementary', emoji: '📚' },
  LATE_ELEMENTARY: { id: 'late_elementary', min: 9, max: 11, label: 'Late Elementary', emoji: '🎒' },
  MIDDLE_SCHOOL: { id: 'middle_school', min: 12, max: 14, label: 'Middle School', emoji: '🎓' },
  HIGH_SCHOOL: { id: 'high_school', min: 15, max: 18, label: 'High School', emoji: '🎯' },
};

// Activity categories
export const CATEGORIES = {
  ACTIVE: { id: 'active', label: 'Active Play', emoji: '🏃', color: '#ef4444' },
  CREATIVE: { id: 'creative', label: 'Creative', emoji: '🎨', color: '#f59e0b' },
  EDUCATIONAL: { id: 'educational', label: 'Educational', emoji: '📚', color: '#3b82f6' },
  SOCIAL: { id: 'social', label: 'Social', emoji: '👥', color: '#8b5cf6' },
  CALM: { id: 'calm', label: 'Calm/Quiet', emoji: '😌', color: '#06b6d4' },
  OUTDOOR: { id: 'outdoor', label: 'Outdoor', emoji: '🌳', color: '#10b981' },
  MUSIC: { id: 'music', label: 'Music', emoji: '🎵', color: '#ec4899' },
  GAMES: { id: 'games', label: 'Games', emoji: '🎮', color: '#6366f1' },
};

// Location types
export const LOCATIONS = {
  INDOOR: { id: 'indoor', label: 'Indoor', emoji: '🏠' },
  OUTDOOR: { id: 'outdoor', label: 'Outdoor', emoji: '🌤️' },
  BOTH: { id: 'both', label: 'Either', emoji: '🔄' },
};

// Time durations (in minutes)
export const DURATIONS = {
  QUICK: { id: 'quick', min: 5, max: 15, label: '5-15 min', emoji: '⚡' },
  SHORT: { id: 'short', min: 15, max: 30, label: '15-30 min', emoji: '🕐' },
  MEDIUM: { id: 'medium', min: 30, max: 60, label: '30-60 min', emoji: '🕑' },
  LONG: { id: 'long', min: 60, max: 120, label: '1-2 hours', emoji: '🕒' },
  EXTENDED: { id: 'extended', min: 120, max: 999, label: '2+ hours', emoji: '🕓' },
};

// Energy levels
export const ENERGY_LEVELS = {
  LOW: { id: 'low', label: 'Low Energy', emoji: '😴', description: 'Calm, quiet activities' },
  MEDIUM: { id: 'medium', label: 'Medium Energy', emoji: '😊', description: 'Moderate engagement' },
  HIGH: { id: 'high', label: 'High Energy', emoji: '🔥', description: 'Active, physical' },
};

// Materials/supplies needed
export const MATERIALS = {
  NONE: { id: 'none', label: 'No supplies needed' },
  BASIC: { id: 'basic', label: 'Basic household items' },
  CRAFT: { id: 'craft', label: 'Craft supplies' },
  SPORTS: { id: 'sports', label: 'Sports equipment' },
  KITCHEN: { id: 'kitchen', label: 'Kitchen supplies' },
  TECH: { id: 'tech', label: 'Technology/devices' },
  SPECIAL: { id: 'special', label: 'Special equipment' },
};

// Number of participants
export const PARTICIPANTS = {
  SOLO: { id: 'solo', min: 1, max: 1, label: 'Solo', emoji: '👤' },
  PAIR: { id: 'pair', min: 2, max: 2, label: 'Pair', emoji: '👥' },
  SMALL_GROUP: { id: 'small_group', min: 3, max: 5, label: 'Small Group', emoji: '👨‍👩‍👧' },
  LARGE_GROUP: { id: 'large_group', min: 6, max: 99, label: 'Large Group', emoji: '👨‍👩‍👧‍👦' },
  ANY: { id: 'any', min: 1, max: 99, label: 'Any', emoji: '🔢' },
};

// Weather requirements for outdoor activities
export const WEATHER = {
  ANY: { id: 'any', label: 'Any weather' },
  SUNNY: { id: 'sunny', label: 'Sunny/clear' },
  WARM: { id: 'warm', label: 'Warm weather' },
  COOL: { id: 'cool', label: 'Cool weather' },
  RAINY: { id: 'rainy', label: 'Rain-friendly' },
  SNOWY: { id: 'snowy', label: 'Snow activities' },
};

// Mess level - how messy does this activity get?
export const MESS_LEVELS = {
  NONE: { id: 'none', label: 'No mess', emoji: '✨' },
  LOW: { id: 'low', label: 'Low mess', emoji: '🧹' },
  MESSY: { id: 'messy', label: 'Messy', emoji: '🎨' },
};

// Setup time - how long to get started?
export const SETUP_TIMES = {
  INSTANT: { id: 'instant', label: 'No setup', emoji: '⚡' },
  QUICK: { id: 'quick', label: '< 5 min setup', emoji: '🕐' },
  SOME_PREP: { id: 'some_prep', label: '5-15 min setup', emoji: '🕑' },
};

// Situation/context tags - when is this activity ideal?
export const CONTEXTS = {
  RAINY_DAY: { id: 'rainy_day', label: 'Rainy Day', emoji: '🌧️' },
  CAR_RIDE: { id: 'car_ride', label: 'Car Ride', emoji: '🚗' },
  WAITING_ROOM: { id: 'waiting_room', label: 'Waiting Room', emoji: '⏰' },
  BEFORE_BED: { id: 'before_bed', label: 'Before Bed', emoji: '🌙' },
  ENERGY_BURNER: { id: 'energy_burner', label: 'Burn Energy', emoji: '🔥' },
  SCREEN_FREE: { id: 'screen_free', label: 'Screen-Free', emoji: '📵' },
  SIBLING_PLAY: { id: 'sibling_play', label: 'Sibling Play', emoji: '👫' },
  SOLO_PLAY: { id: 'solo_play', label: 'Solo Play', emoji: '👤' },
  QUICK_DISTRACTION: { id: 'quick_distraction', label: 'Quick Distraction', emoji: '✨' },
  BONDING_TIME: { id: 'bonding_time', label: 'Family Bonding', emoji: '❤️' },
};

/**
 * Activity Schema
 *
 * @typedef {Object} Activity
 * @property {string} id - Unique identifier
 * @property {string} title - Activity name
 * @property {string} description - Brief description
 * @property {string} emoji - Representative emoji
 * @property {string} category - Category ID from CATEGORIES
 * @property {string[]} ageGroups - Array of age group IDs
 * @property {string} location - Location ID (indoor/outdoor/both)
 * @property {string} duration - Duration ID
 * @property {string} energy - Energy level ID
 * @property {string} materials - Materials needed ID
 * @property {string} participants - Participant count ID
 * @property {string[]} interests - Related interest IDs (from kidsService)
 * @property {string[]} tags - Additional searchable tags
 * @property {string} [weather] - Weather requirement (outdoor only)
 * @property {string} [messLevel] - How messy (none/low/messy)
 * @property {string} [setupTime] - Setup time (instant/quick/some_prep)
 * @property {string[]} [contexts] - Situational context tags
 * @property {string[]} [instructions] - Step-by-step instructions
 * @property {string[]} [tips] - Helpful tips
 * @property {string[]} [variations] - Activity variations
 * @property {boolean} [adultSupervision] - Requires adult supervision
 * @property {number} [popularityScore] - For sorting (0-100)
 */

// Helper to create activity object
export const createActivity = ({
  id,
  title,
  description,
  emoji,
  category,
  ageGroups,
  location,
  duration,
  energy,
  materials = 'none',
  participants = 'any',
  interests = [],
  tags = [],
  weather = 'any',
  messLevel = 'none',
  setupTime = 'instant',
  contexts = [],
  instructions = [],
  tips = [],
  variations = [],
  adultSupervision = false,
  popularityScore = 50,
}) => ({
  id,
  title,
  description,
  emoji,
  category,
  ageGroups,
  location,
  duration,
  energy,
  materials,
  participants,
  interests,
  tags,
  weather,
  messLevel,
  setupTime,
  contexts,
  instructions,
  tips,
  variations,
  adultSupervision,
  popularityScore,
});

export default {
  AGE_GROUPS,
  CATEGORIES,
  LOCATIONS,
  DURATIONS,
  ENERGY_LEVELS,
  MATERIALS,
  PARTICIPANTS,
  WEATHER,
  MESS_LEVELS,
  SETUP_TIMES,
  CONTEXTS,
  createActivity,
};
