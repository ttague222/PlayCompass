/**
 * PlayCompass Config Exports
 */

export * from './theme';
export * from './firebase';

// API configuration (will be populated with Cloud Run URL)
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
};

// App configuration
export const APP_CONFIG = {
  appName: 'PlayCompass',
  version: '1.0.0',
  maxKidsPerAccount: 5,
  defaultSessionDuration: 30, // minutes
};
