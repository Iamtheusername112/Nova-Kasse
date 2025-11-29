/**
 * Session management utilities
 */

const SESSION_STORAGE_KEY = 'nova-kasse-session';
const SESSION_TIMEOUT_KEY = 'nova-kasse-session-timeout';

/**
 * Get session expiration time (default: 7 days)
 */
export const getSessionExpiration = () => {
  const stored = typeof window !== 'undefined' 
    ? localStorage.getItem(SESSION_TIMEOUT_KEY) 
    : null;
  
  if (stored) {
    return parseInt(stored, 10);
  }
  
  // Default: 7 days in milliseconds
  return 7 * 24 * 60 * 60 * 1000;
};

/**
 * Set session expiration time
 */
export const setSessionExpiration = (days = 7) => {
  if (typeof window !== 'undefined') {
    const expiration = days * 24 * 60 * 60 * 1000;
    localStorage.setItem(SESSION_TIMEOUT_KEY, expiration.toString());
  }
};

/**
 * Check if session is expired
 */
export const isSessionExpired = (sessionTimestamp) => {
  if (!sessionTimestamp) return true;
  
  const expiration = getSessionExpiration();
  const now = Date.now();
  const elapsed = now - sessionTimestamp;
  
  return elapsed > expiration;
};

/**
 * Store session timestamp
 */
export const storeSessionTimestamp = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, Date.now().toString());
  }
};

/**
 * Get stored session timestamp
 */
export const getSessionTimestamp = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  }
  return null;
};

/**
 * Check if an error is a refresh token error
 */
export const isRefreshTokenError = (error) => {
  if (!error) return false;
  
  const errorMessage = error?.message || error?.toString() || '';
  const errorName = error?.name || '';
  
  return (
    errorMessage.includes('Refresh Token') ||
    errorMessage.includes('refresh_token') ||
    errorMessage.includes('Invalid Refresh Token') ||
    errorMessage.includes('Refresh Token Not Found') ||
    errorName === 'AuthApiError' && errorMessage.includes('refresh')
  );
};

/**
 * Clear session data from storage
 */
export const clearSessionStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMEOUT_KEY);
    // Clear Supabase auth storage specifically
    localStorage.removeItem('nova-kasse-auth');
    // Also clear any other app-specific storage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nova-kasse-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

/**
 * Clear all cookies (for logout)
 */
export const clearCookies = () => {
  if (typeof document !== 'undefined') {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
};

