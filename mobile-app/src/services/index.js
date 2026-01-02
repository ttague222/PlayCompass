/**
 * PlayCompass Services
 *
 * API and data services
 */

// Auth service
export * from './authService';
export { default as authService } from './authService';

// Kids service
export * from './kidsService';
export { default as kidsService } from './kidsService';

// Activities service (local data)
export * from './activitiesService';
export { default as activitiesService } from './activitiesService';

// API service (Cloud Run backend)
export * from './apiService';
export { default as api } from './apiService';

// History service
export * from './historyService';

// Analytics service
export * from './analyticsService';
export { default as Analytics } from './analyticsService';

// Crash reporting service
export * from './crashReportingService';
export { default as CrashReporting } from './crashReportingService';

// Subscription service
export * from './subscriptionService';
export { default as SubscriptionService } from './subscriptionService';

// Preference learning service
export * from './preferenceLearningService';
export { default as PreferenceLearning } from './preferenceLearningService';

// Purchase service (RevenueCat)
export * from './purchaseService';
export { default as PurchaseService } from './purchaseService';
