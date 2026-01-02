/**
 * PlayCompass API Service
 *
 * Handles communication with the Cloud Run backend
 */

import { API_BASE_URL } from '@env';
import { getAuth } from '@react-native-firebase/auth';
import { checkRateLimit, maskSensitiveData, logSecurityEvent } from '../utils/security';

const BASE_URL = API_BASE_URL || 'https://playcompass-api-463549869998.us-central1.run.app';

// Rate limit configuration
const RATE_LIMITS = {
  recommendations: { maxCalls: 20, windowMs: 60000 }, // 20 calls per minute
  activities: { maxCalls: 30, windowMs: 60000 }, // 30 calls per minute
  history: { maxCalls: 10, windowMs: 60000 }, // 10 calls per minute
};

/**
 * Get the Firebase auth token for authenticated requests
 */
const getAuthToken = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Make an API request with security enhancements
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  // Check rate limit if specified
  if (options.rateLimit) {
    const limitConfig = RATE_LIMITS[options.rateLimit];
    if (limitConfig) {
      const limitResult = checkRateLimit(`api:${options.rateLimit}`, limitConfig.maxCalls, limitConfig.windowMs);
      if (!limitResult.allowed) {
        logSecurityEvent('rate_limit_exceeded', {
          endpoint,
          retryAfter: limitResult.retryAfter,
        });
        throw new Error(`Rate limit exceeded. Please try again in ${limitResult.retryAfter} seconds.`);
      }
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Platform': 'mobile',
    ...options.headers,
  };

  // Add auth token if available and requested
  if (options.authenticated !== false) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    // Set timeout for requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Only log security events for endpoints that don't have graceful fallbacks
      if (!options.silentOnError) {
        logSecurityEvent('api_error', {
          endpoint,
          status: response.status,
          error: maskSensitiveData(errorData),
        });
      }
      throw new Error(errorData.detail || errorData.error || `API error: ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      logSecurityEvent('api_timeout', { endpoint });
      throw new Error('Request timed out. Please try again.');
    }
    // Only log errors for endpoints that don't have graceful fallbacks
    if (!options.silentOnError) {
      console.error(`API request failed: ${endpoint}`, maskSensitiveData({ error: error.message }));
    }
    throw error;
  }
};

// ============================================
// Health & Info
// ============================================

/**
 * Check API health
 */
export const checkHealth = async () => {
  return apiRequest('/health', { authenticated: false });
};

/**
 * Get API info
 */
export const getApiInfo = async () => {
  return apiRequest('/info', { authenticated: false });
};

// ============================================
// Recommendations
// ============================================

/**
 * Get personalized recommendations
 * @param {Object} params - Recommendation parameters
 * @param {Array} params.kids - Array of kid objects with id, name, age, interests
 * @param {string} params.duration - Duration ID (quick, short, medium, long, extended)
 * @param {string} [params.location] - Location preference (indoor, outdoor, both)
 * @param {string} [params.energy] - Energy level (low, medium, high)
 * @param {Array} [params.excludedActivityIds] - Activity IDs to exclude
 * @param {number} [params.count] - Number of recommendations (default 10)
 */
export const getRecommendations = async ({
  kids,
  duration,
  location = 'both',
  energy = null,
  excludedActivityIds = [],
  count = 10,
}) => {
  return apiRequest('/recommendations', {
    method: 'POST',
    rateLimit: 'recommendations',
    body: JSON.stringify({
      kids: kids.map((kid) => ({
        id: kid.id,
        name: kid.name,
        age: kid.age,
        interests: kid.interests || [],
      })),
      duration,
      location,
      energy,
      excluded_activity_ids: excludedActivityIds,
      count,
    }),
  });
};

/**
 * Get quick recommendations by ages and time
 * @param {Array<number>} ages - Array of kid ages
 * @param {number} minutes - Available time in minutes
 * @param {string} [location] - Location preference
 * @param {number} [count] - Number of recommendations
 */
export const getQuickRecommendations = async (ages, minutes, location = null, count = 5) => {
  const params = new URLSearchParams({
    ages: ages.join(','),
    minutes: minutes.toString(),
    count: count.toString(),
  });

  if (location && location !== 'both') {
    params.append('location', location);
  }

  return apiRequest(`/recommendations/quick?${params}`, {
    method: 'GET',
    authenticated: false,
  });
};

/**
 * Get a random activity
 * @param {Array<number>} ages - Array of kid ages
 * @param {string} [location] - Location preference
 * @param {string} [energy] - Energy level preference
 */
export const getRandomActivity = async (ages, location = null, energy = null) => {
  const params = new URLSearchParams({
    ages: ages.join(','),
  });

  if (location) params.append('location', location);
  if (energy) params.append('energy', energy);

  return apiRequest(`/recommendations/random?${params}`, {
    method: 'GET',
    authenticated: false,
  });
};

// ============================================
// Activities
// ============================================

/**
 * List activities with optional filtering
 * @param {Object} [filters] - Filter options
 */
export const listActivities = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.category) params.append('category', filters.category);
  if (filters.ageGroup) params.append('age_group', filters.ageGroup);
  if (filters.duration) params.append('duration', filters.duration);
  if (filters.location) params.append('location', filters.location);
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/activities?${queryString}` : '/activities';

  return apiRequest(endpoint, { authenticated: false });
};

/**
 * Get activity by ID
 * @param {string} activityId - Activity ID
 */
export const getActivity = async (activityId) => {
  return apiRequest(`/activities/${activityId}`, { authenticated: false });
};

/**
 * Get activity categories with counts
 */
export const getCategories = async () => {
  return apiRequest('/activities/categories/list', { authenticated: false });
};

// ============================================
// History (requires auth)
// ============================================

/**
 * Save activity history
 * @param {Array} entries - Array of history entries
 */
export const saveHistory = async (entries) => {
  return apiRequest('/history', {
    method: 'POST',
    rateLimit: 'history',
    body: JSON.stringify({ entries }),
    authenticated: true,
    silentOnError: true, // History has graceful fallback to local storage
  });
};

/**
 * Get activity history
 * @param {number} [limit] - Maximum entries to retrieve
 */
export const getHistory = async (limit = 50) => {
  return apiRequest(`/history?limit=${limit}`, {
    method: 'GET',
    rateLimit: 'history',
    authenticated: true,
    silentOnError: true, // History has graceful fallback to local storage
  });
};

// ============================================
// Export default API object
// ============================================

export default {
  // Health
  checkHealth,
  getApiInfo,

  // Recommendations
  getRecommendations,
  getQuickRecommendations,
  getRandomActivity,

  // Activities
  listActivities,
  getActivity,
  getCategories,

  // History
  saveHistory,
  getHistory,

  // Constants
  BASE_URL,
};
