/**
 * Tests for Weather Service
 */

import weatherService from '../../services/weatherService';

describe('weatherService', () => {
  describe('exports', () => {
    it('should export getCurrentLocation', () => {
      expect(typeof weatherService.getCurrentLocation).toBe('function');
    });

    it('should export fetchWeatherFromAPI', () => {
      expect(typeof weatherService.fetchWeatherFromAPI).toBe('function');
    });

    it('should export getCurrentWeather', () => {
      expect(typeof weatherService.getCurrentWeather).toBe('function');
    });

    it('should export getDefaultWeather', () => {
      expect(typeof weatherService.getDefaultWeather).toBe('function');
    });

    it('should export getActivityWeatherTag', () => {
      expect(typeof weatherService.getActivityWeatherTag).toBe('function');
    });

    it('should export isActivitySuitableForWeather', () => {
      expect(typeof weatherService.isActivitySuitableForWeather).toBe('function');
    });

    it('should export filterActivitiesByWeather', () => {
      expect(typeof weatherService.filterActivitiesByWeather).toBe('function');
    });

    it('should export getWeatherSuggestions', () => {
      expect(typeof weatherService.getWeatherSuggestions).toBe('function');
    });

    it('should export getWeatherEmoji', () => {
      expect(typeof weatherService.getWeatherEmoji).toBe('function');
    });
  });

  describe('getDefaultWeather', () => {
    it('should return a default weather object', () => {
      const weather = weatherService.getDefaultWeather();

      expect(weather).toHaveProperty('condition');
      expect(weather).toHaveProperty('description');
      expect(weather).toHaveProperty('temperature');
      expect(weather).toHaveProperty('feelsLike');
      expect(weather).toHaveProperty('humidity');
      expect(weather).toHaveProperty('windSpeed');
      expect(weather).toHaveProperty('city');
      expect(weather).toHaveProperty('icon');
    });

    it('should return Clear as default condition', () => {
      const weather = weatherService.getDefaultWeather();
      expect(weather.condition).toBe('Clear');
    });
  });

  describe('getActivityWeatherTag', () => {
    it('should return sunny for clear weather', () => {
      const weather = { condition: 'Clear', temperature: 22 };
      expect(weatherService.getActivityWeatherTag(weather)).toBe('sunny');
    });

    it('should return rainy for rain conditions', () => {
      const weather = { condition: 'Rain', temperature: 18 };
      expect(weatherService.getActivityWeatherTag(weather)).toBe('rainy');
    });

    it('should return snowy for snow conditions', () => {
      const weather = { condition: 'Snow', temperature: -2 };
      expect(weatherService.getActivityWeatherTag(weather)).toBe('snowy');
    });

    it('should return warm for hot clear weather', () => {
      const weather = { condition: 'Clear', temperature: 30 };
      expect(weatherService.getActivityWeatherTag(weather)).toBe('warm');
    });

    it('should return cool for cool temperatures', () => {
      const weather = { condition: 'Clouds', temperature: 10 };
      expect(weatherService.getActivityWeatherTag(weather)).toBe('cool');
    });
  });

  describe('isActivitySuitableForWeather', () => {
    it('should return true for indoor activities regardless of weather', () => {
      const activity = { location: 'indoor', weather: 'sunny' };
      expect(weatherService.isActivitySuitableForWeather(activity, 'rainy')).toBe(true);
    });

    it('should return true for any-weather activities', () => {
      const activity = { location: 'outdoor', weather: 'any' };
      expect(weatherService.isActivitySuitableForWeather(activity, 'rainy')).toBe(true);
    });

    it('should return true when weather matches', () => {
      const activity = { location: 'outdoor', weather: 'sunny' };
      expect(weatherService.isActivitySuitableForWeather(activity, 'sunny')).toBe(true);
    });

    it('should return false when weather does not match', () => {
      const activity = { location: 'outdoor', weather: 'sunny' };
      expect(weatherService.isActivitySuitableForWeather(activity, 'rainy')).toBe(false);
    });

    it('should return true for sunny activities in warm weather', () => {
      const activity = { location: 'outdoor', weather: 'sunny' };
      expect(weatherService.isActivitySuitableForWeather(activity, 'warm')).toBe(true);
    });
  });

  describe('getWeatherSuggestions', () => {
    it('should return suggestions for sunny weather', () => {
      const weather = { condition: 'Clear', temperature: 25 };
      const suggestions = weatherService.getWeatherSuggestions(weather);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('text');
      expect(suggestions[0]).toHaveProperty('emoji');
    });

    it('should return indoor suggestions for rainy weather', () => {
      const weather = { condition: 'Rain', temperature: 15 };
      const suggestions = weatherService.getWeatherSuggestions(weather);

      expect(suggestions.some(s => s.text.toLowerCase().includes('indoor'))).toBe(true);
    });

    it('should return snow suggestions for snowy weather', () => {
      const weather = { condition: 'Snow', temperature: -5 };
      const suggestions = weatherService.getWeatherSuggestions(weather);

      expect(suggestions.some(s => s.text.toLowerCase().includes('snow'))).toBe(true);
    });
  });

  describe('getWeatherEmoji', () => {
    it('should return sun emoji for Clear', () => {
      expect(weatherService.getWeatherEmoji('Clear')).toBe('☀️');
    });

    it('should return rain emoji for Rain', () => {
      expect(weatherService.getWeatherEmoji('Rain')).toBe('🌧️');
    });

    it('should return snow emoji for Snow', () => {
      expect(weatherService.getWeatherEmoji('Snow')).toBe('❄️');
    });

    it('should return cloud emoji for Clouds', () => {
      expect(weatherService.getWeatherEmoji('Clouds')).toBe('☁️');
    });

    it('should return default emoji for unknown condition', () => {
      expect(weatherService.getWeatherEmoji('Unknown')).toBe('🌤️');
    });
  });
});
