/**
 * PlayCompass Crash Reporting Service
 *
 * Captures and stores crash/error information
 */

import * as Application from 'expo-application';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CRASHES_KEY = '@playcompass_crashes';
const MAX_CRASHES = 50;

// Check if crash reporting is enabled
const isEnabled = () => {
  return Constants.expoConfig?.extra?.enableCrashReporting !== false;
};

// Get device info for crash context
const getDeviceContext = () => {
  return {
    appVersion: Application.nativeApplicationVersion || 'dev',
    buildVersion: Application.nativeBuildVersion || 'dev',
    platform: Constants.platform?.os || 'unknown',
    expoVersion: Constants.expoVersion || 'unknown',
    deviceName: Constants.deviceName || 'unknown',
  };
};

/**
 * Store crash report locally
 */
const storeCrash = async (crashReport) => {
  if (!isEnabled()) return;

  try {
    const stored = await AsyncStorage.getItem(CRASHES_KEY);
    const crashes = stored ? JSON.parse(stored) : [];

    // Keep last MAX_CRASHES
    while (crashes.length >= MAX_CRASHES) {
      crashes.shift();
    }

    crashes.push(crashReport);
    await AsyncStorage.setItem(CRASHES_KEY, JSON.stringify(crashes));
  } catch (error) {
    console.warn('Failed to store crash report:', error);
  }
};

/**
 * Capture an error/exception
 */
export const captureException = async (error, context = {}) => {
  if (!isEnabled()) return;

  const crashReport = {
    id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: 'exception',
    error: {
      name: error?.name || 'Error',
      message: error?.message || String(error),
      stack: error?.stack || null,
    },
    context: {
      ...context,
      screen: context.screen || 'unknown',
      action: context.action || 'unknown',
    },
    device: getDeviceContext(),
  };

  await storeCrash(crashReport);

  // Log in development
  if (__DEV__) {
    console.error('[CrashReporting] Exception captured:', crashReport);
  }

  return crashReport.id;
};

/**
 * Capture a message (non-fatal issue)
 */
export const captureMessage = async (message, level = 'warning', context = {}) => {
  if (!isEnabled()) return;

  const report = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: 'message',
    level, // 'info', 'warning', 'error'
    message,
    context: {
      ...context,
      screen: context.screen || 'unknown',
    },
    device: getDeviceContext(),
  };

  await storeCrash(report);

  if (__DEV__) {
    console.warn('[CrashReporting] Message captured:', report);
  }

  return report.id;
};

/**
 * Set user context for crash reports
 */
let userContext = {};

export const setUser = (user) => {
  if (user) {
    userContext = {
      id: user.uid,
      email: user.email,
      name: user.displayName,
    };
  } else {
    userContext = {};
  }
};

/**
 * Add breadcrumb for debugging
 */
const breadcrumbs = [];
const MAX_BREADCRUMBS = 30;

export const addBreadcrumb = (message, category = 'default', data = {}) => {
  const breadcrumb = {
    timestamp: new Date().toISOString(),
    message,
    category,
    data,
  };

  breadcrumbs.push(breadcrumb);

  // Keep last MAX_BREADCRUMBS
  while (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
};

/**
 * Get breadcrumbs for debugging
 */
export const getBreadcrumbs = () => [...breadcrumbs];

/**
 * Clear breadcrumbs
 */
export const clearBreadcrumbs = () => {
  breadcrumbs.length = 0;
};

/**
 * Wrap a function with error handling
 */
export const withErrorBoundary = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await captureException(error, {
        ...context,
        functionName: fn.name || 'anonymous',
        args: args.length,
      });
      throw error;
    }
  };
};

/**
 * Get stored crash reports
 */
export const getCrashReports = async () => {
  try {
    const stored = await AsyncStorage.getItem(CRASHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Clear crash reports
 */
export const clearCrashReports = async () => {
  try {
    await AsyncStorage.removeItem(CRASHES_KEY);
    clearBreadcrumbs();
  } catch (error) {
    console.warn('Failed to clear crash reports:', error);
  }
};

/**
 * Get crash summary
 */
export const getCrashSummary = async () => {
  const crashes = await getCrashReports();

  const summary = {
    totalCrashes: crashes.length,
    exceptions: crashes.filter((c) => c.type === 'exception').length,
    messages: crashes.filter((c) => c.type === 'message').length,
    byLevel: {},
    recentCrashes: crashes.slice(-5),
  };

  crashes.forEach((crash) => {
    if (crash.level) {
      summary.byLevel[crash.level] = (summary.byLevel[crash.level] || 0) + 1;
    }
  });

  return summary;
};

/**
 * Initialize global error handler
 */
export const initializeCrashReporting = () => {
  // Set up global error handler for unhandled JS errors
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    await captureException(error, {
      isFatal,
      source: 'globalHandler',
    });

    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections
  const originalRejectionHandler = global.onunhandledrejection;

  global.onunhandledrejection = async (event) => {
    await captureException(event.reason || new Error('Unhandled Promise Rejection'), {
      source: 'unhandledRejection',
    });

    if (originalRejectionHandler) {
      originalRejectionHandler(event);
    }
  };

  addBreadcrumb('Crash reporting initialized', 'system');
};

export default {
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  getBreadcrumbs,
  clearBreadcrumbs,
  withErrorBoundary,
  getCrashReports,
  clearCrashReports,
  getCrashSummary,
  initializeCrashReporting,
};
