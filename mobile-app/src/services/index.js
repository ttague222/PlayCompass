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

// Weather service
export * from './weatherService';
export { default as WeatherService } from './weatherService';

// Custom activity service
export * from './customActivityService';
export { default as CustomActivityService } from './customActivityService';

// Progress service
export * from './progressService';
export { default as ProgressService } from './progressService';

// Scheduler service
export * from './schedulerService';
export { default as SchedulerService } from './schedulerService';

// Social service
export * from './socialService';
export { default as SocialService } from './socialService';

// Offline service
export * from './offlineService';
export { default as OfflineService } from './offlineService';

// Print service
export * from './printService';
export { default as PrintService } from './printService';

// Personalization service
export * from './personalizationService';
export { default as PersonalizationService } from './personalizationService';

// Family sharing service
export * from './familySharingService';
export { default as FamilySharingService } from './familySharingService';
