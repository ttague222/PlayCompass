/**
 * PlayCompass Weather Service
 *
 * Provides weather-aware activity suggestions by fetching current weather
 * and mapping it to appropriate activity weather tags
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamically import expo-location to handle cases where the native module isn't available
let Location = null;
try {
  Location = require('expo-location');
} catch (e) {
  console.warn('[WeatherService] expo-location not available, location features disabled');
}

const WEATHER_CACHE_KEY = '@playcompass_weather_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// OpenWeatherMap API (free tier allows 1000 calls/day)
// Users should set their own API key in environment
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

/**
 * Weather condition mappings to activity weather tags
 */
const WEATHER_MAPPINGS = {
  // Clear/Sunny conditions
  Clear: 'sunny',
  // Cloudy conditions
  Clouds: 'any',
  // Rain conditions
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'rainy',
  // Snow conditions
  Snow: 'snowy',
  // Other
  Mist: 'any',
  Fog: 'any',
  Haze: 'any',
};

/**
 * Temperature-based weather suggestions
 */
const getTemperatureCategory = (tempCelsius) => {
  if (tempCelsius >= 25) return 'warm';
  if (tempCelsius >= 15) return 'any';
  if (tempCelsius >= 5) return 'cool';
  return 'snowy'; // Very cold, likely snow activities appropriate
};

/**
 * Get current device location
 */
export const getCurrentLocation = async () => {
  // Check if Location module is available
  if (!Location) {
    return {
      success: false,
      error: 'Location services not available. Rebuild the app to enable.'
    };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Location permission denied' };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      success: true,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch weather from OpenWeatherMap API
 */
export const fetchWeatherFromAPI = async (latitude, longitude) => {
  if (!OPENWEATHER_API_KEY) {
    return {
      success: false,
      error: 'Weather API key not configured',
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      weather: {
        condition: data.weather[0]?.main || 'Clear',
        description: data.weather[0]?.description || 'clear sky',
        temperature: data.main?.temp || 20,
        feelsLike: data.main?.feels_like || 20,
        humidity: data.main?.humidity || 50,
        windSpeed: data.wind?.speed || 0,
        city: data.name || 'Unknown',
        icon: data.weather[0]?.icon || '01d',
      },
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get cached weather data
 */
export const getCachedWeather = async () => {
  try {
    const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      const now = Date.now();
      if (now - data.timestamp < CACHE_DURATION_MS) {
        return { success: true, weather: data.weather, fromCache: true };
      }
    }
    return { success: false };
  } catch (error) {
    console.error('Error reading weather cache:', error);
    return { success: false };
  }
};

/**
 * Save weather data to cache
 */
export const cacheWeather = async (weather) => {
  try {
    await AsyncStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({
        weather,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error caching weather:', error);
  }
};

/**
 * Get current weather (with caching)
 */
export const getCurrentWeather = async () => {
  // Try cache first
  const cached = await getCachedWeather();
  if (cached.success) {
    return cached;
  }

  // Get location
  const locationResult = await getCurrentLocation();
  if (!locationResult.success) {
    return {
      success: false,
      error: locationResult.error,
      fallback: getDefaultWeather(),
    };
  }

  // Fetch from API
  const weatherResult = await fetchWeatherFromAPI(
    locationResult.latitude,
    locationResult.longitude
  );

  if (weatherResult.success) {
    await cacheWeather(weatherResult.weather);
    return weatherResult;
  }

  return {
    success: false,
    error: weatherResult.error,
    fallback: getDefaultWeather(),
  };
};

/**
 * Get default weather when API is unavailable
 */
export const getDefaultWeather = () => ({
  condition: 'Clear',
  description: 'Weather unavailable',
  temperature: 20,
  feelsLike: 20,
  humidity: 50,
  windSpeed: 0,
  city: 'Unknown',
  icon: '01d',
});

/**
 * Map weather condition to activity weather tag
 */
export const getActivityWeatherTag = (weather) => {
  const conditionTag = WEATHER_MAPPINGS[weather.condition] || 'any';
  const temperatureTag = getTemperatureCategory(weather.temperature);

  // Return the most specific tag
  if (weather.condition === 'Snow' || temperatureTag === 'snowy') {
    return 'snowy';
  }
  if (weather.condition === 'Rain' || weather.condition === 'Drizzle') {
    return 'rainy';
  }
  if (temperatureTag === 'warm' && conditionTag === 'sunny') {
    return 'warm';
  }
  if (temperatureTag === 'cool') {
    return 'cool';
  }
  return conditionTag;
};

/**
 * Check if an activity is suitable for current weather
 * Uses relaxed matching to avoid being too restrictive
 */
export const isActivitySuitableForWeather = (activity, currentWeatherTag) => {
  const activityWeather = activity.weather || 'any';

  // Any weather activities are always suitable
  if (activityWeather === 'any') return true;

  // Indoor activities are always suitable (including 'both' which can be done indoors)
  if (activity.location === 'indoor' || activity.location === 'both') return true;

  // Check if weather matches exactly
  if (activityWeather === currentWeatherTag) return true;

  // Any weather tag from the current conditions means show everything
  if (currentWeatherTag === 'any') return true;

  // Relaxed weather matching for better results:
  // - Sunny activities are suitable for warm and cool weather (not raining/snowing)
  if (activityWeather === 'sunny' && (currentWeatherTag === 'warm' || currentWeatherTag === 'cool')) return true;

  // - Cool weather activities work in warm weather too
  if (activityWeather === 'cool' && currentWeatherTag === 'warm') return true;

  // - If activity requires no specific weather and it's not actively bad weather, allow it
  // This catches edge cases where activities might not have weather tags
  if (!activityWeather && currentWeatherTag !== 'rainy' && currentWeatherTag !== 'snowy') return true;

  return false;
};

/**
 * Filter activities by current weather
 */
export const filterActivitiesByWeather = async (activities) => {
  const weatherResult = await getCurrentWeather();
  const weather = weatherResult.success ? weatherResult.weather : getDefaultWeather();
  const weatherTag = getActivityWeatherTag(weather);

  const suitable = activities.filter((activity) =>
    isActivitySuitableForWeather(activity, weatherTag)
  );

  return {
    activities: suitable,
    weather,
    weatherTag,
    filtered: activities.length - suitable.length,
  };
};

/**
 * Get weather-based activity suggestions
 */
export const getWeatherSuggestions = (weather) => {
  const tag = getActivityWeatherTag(weather);
  const suggestions = [];

  switch (tag) {
    case 'sunny':
    case 'warm':
      suggestions.push(
        { text: 'Great day for outdoor activities!', emoji: '☀️' },
        { text: 'Perfect weather for the park', emoji: '🌳' },
        { text: 'Consider water activities', emoji: '💦' }
      );
      break;
    case 'rainy':
      suggestions.push(
        { text: 'Indoor activities recommended', emoji: '🏠' },
        { text: 'Great day for arts & crafts', emoji: '🎨' },
        { text: 'Try some cooking activities', emoji: '👨‍🍳' }
      );
      break;
    case 'snowy':
      suggestions.push(
        { text: 'Bundle up for snow activities!', emoji: '❄️' },
        { text: 'Build a snowman', emoji: '⛄' },
        { text: 'Cozy indoor activities too', emoji: '🧣' }
      );
      break;
    case 'cool':
      suggestions.push(
        { text: 'Nice weather for active play', emoji: '🏃' },
        { text: 'Layer up and head outside', emoji: '🧥' },
        { text: 'Perfect for nature walks', emoji: '🍂' }
      );
      break;
    default:
      suggestions.push(
        { text: 'Lots of activity options today', emoji: '🎯' },
        { text: 'Check out our recommendations', emoji: '✨' }
      );
  }

  return suggestions;
};

/**
 * Get weather emoji for display
 */
export const getWeatherEmoji = (condition) => {
  const emojiMap = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
  };
  return emojiMap[condition] || '🌤️';
};

export default {
  getCurrentLocation,
  fetchWeatherFromAPI,
  getCachedWeather,
  cacheWeather,
  getCurrentWeather,
  getDefaultWeather,
  getActivityWeatherTag,
  isActivitySuitableForWeather,
  filterActivitiesByWeather,
  getWeatherSuggestions,
  getWeatherEmoji,
};
