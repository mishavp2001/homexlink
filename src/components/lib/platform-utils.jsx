/**
 * Platform detection utilities for web and mobile
 */

/**
 * Check if the app is running inside Capacitor (mobile app)
 * @returns {boolean} True if running in Capacitor, false otherwise
 */
export const isCapacitor = () => {
  try {
    // Check if window.Capacitor exists
    if (typeof window !== 'undefined' && window.Capacitor !== undefined) {
      // If isNativePlatform method exists, use it
      if (typeof window.Capacitor.isNativePlatform === 'function') {
        return window.Capacitor.isNativePlatform();
      }
      // Otherwise, just return true if Capacitor object exists
      return true;
    }

    // Fallback: Check user agent for Capacitor indicators
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (ua.includes('CapacitorWebView') || ua.includes('Capacitor')) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn('[isCapacitor] Error detecting Capacitor:', error);
    return false;
  }
};
/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
  return import.meta.env.DEV;
};

/**
 * Get the appropriate OAuth redirect URI based on platform
 * @param {string} fallbackUrl - Fallback URL for web (default: current URL)
 * @returns {string} The redirect URI to use
 */
export const getOAuthRedirectUri = (fallbackUrl) => {
  if (isCapacitor()) {
    // Mobile app: use custom URL scheme for OAuth callback
    return 'homexlink://callback';
  }
  
  // Web app: use provided fallback or current URL
  return fallbackUrl || window.location.href;
};

/**
 * Get platform information
 * @returns {object} Platform details
 */
export const getPlatformInfo = () => {
  const isMobile = isCapacitor();
  
  return {
    isCapacitor: isMobile,
    isMobile,
    isWeb: !isMobile,
    isDevelopment: isDevelopment(),
    platform: isMobile ? 'mobile' : 'web',
    redirectUri: getOAuthRedirectUri()
  };
};