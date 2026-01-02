/**
 * PlayCompass Security Utilities
 *
 * Security helpers and validation functions
 */

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove potential script injections
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate kid name (no special characters except spaces and hyphens)
 */
export const isValidKidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate age is within acceptable range
 */
export const isValidAge = (age) => {
  const numAge = parseInt(age, 10);
  return !isNaN(numAge) && numAge >= 0 && numAge <= 18;
};

/**
 * Rate limiter for API calls
 */
const rateLimitMap = new Map();

export const checkRateLimit = (key, maxCalls, windowMs) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create call history for this key
  let calls = rateLimitMap.get(key) || [];

  // Filter to only calls within the window
  calls = calls.filter((timestamp) => timestamp > windowStart);

  // Check if over limit
  if (calls.length >= maxCalls) {
    return {
      allowed: false,
      retryAfter: Math.ceil((calls[0] + windowMs - now) / 1000),
    };
  }

  // Add this call
  calls.push(now);
  rateLimitMap.set(key, calls);

  return { allowed: true, remaining: maxCalls - calls.length };
};

/**
 * Clear rate limit history (for testing or user logout)
 */
export const clearRateLimit = (key) => {
  if (key) {
    rateLimitMap.delete(key);
  } else {
    rateLimitMap.clear();
  }
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'email'];
  const masked = { ...data };

  Object.keys(masked).forEach((key) => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  });

  return masked;
};

/**
 * Generate a secure random ID
 */
export const generateSecureId = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
};

/**
 * Validate URL is safe (no javascript: or data: URLs)
 */
export const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  const lowerUrl = url.toLowerCase().trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some((p) => lowerUrl.startsWith(p))) {
    return false;
  }

  // Allow http, https, and relative URLs
  return lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://') || lowerUrl.startsWith('/');
};

/**
 * Validate Firebase UID format
 */
export const isValidFirebaseUid = (uid) => {
  if (!uid || typeof uid !== 'string') return false;
  // Firebase UIDs are alphanumeric and between 1-128 characters
  return /^[a-zA-Z0-9]{1,128}$/.test(uid);
};

/**
 * Secure JSON parse with error handling
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message);
    return fallback;
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = () => {
  return __DEV__ === true;
};

/**
 * Log security event (for audit trail)
 */
export const logSecurityEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  const sanitizedDetails = maskSensitiveData(details);

  if (isDevelopment()) {
    console.log('[Security Event]', event, sanitizedDetails);
  }

  // In production, you would send this to a logging service
  // For now, we just log locally
};

export default {
  sanitizeInput,
  isValidEmail,
  isValidKidName,
  isValidAge,
  checkRateLimit,
  clearRateLimit,
  maskSensitiveData,
  generateSecureId,
  isSafeUrl,
  isValidFirebaseUid,
  safeJsonParse,
  isDevelopment,
  logSecurityEvent,
};
