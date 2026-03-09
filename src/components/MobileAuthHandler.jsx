import { base44 } from '@/api/base44Client';
import { Capacitor } from '@capacitor/core';

// Mobile app redirect URI
export const MOBILE_REDIRECT_URI = 'com.homexlink.app://callback';

// Cache the result to avoid repeated native bridge calls
let _isNative;

/**
 * Checks if the application is running in a native Capacitor environment
 * (iOS or Android), rather than a web browser or PWA.
 * @returns {boolean} True if running natively, false otherwise.
 */
export const isMobileApp = () => {
  try {
    const debugInfo = {
      capacitorDefined: typeof Capacitor !== 'undefined',
      capacitorHasMethod: typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function',
      windowCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    };

    // First check if Capacitor is available and is native platform
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function') {
      const result = Capacitor.isNativePlatform();
      //console.log('[isMobileApp] Capacitor.isNativePlatform():', result, debugInfo);
      return result;
    }

    // Fallback: Check if window.Capacitor exists (for cases where import might fail)
    if (typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function') {
      const result = window.Capacitor.isNativePlatform();
      //console.log('[isMobileApp] window.Capacitor.isNativePlatform():', result, debugInfo);
      return result;
    }

    // Additional fallback: Check user agent for common mobile app indicators
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      // Check for common Capacitor/Cordova indicators
      if (ua.includes('CapacitorWebView') || ua.includes('Capacitor')) {
        //console.log('[isMobileApp] Detected via UserAgent:', ua);
        return true;
      }
    }

    //console.log('[isMobileApp] Not a mobile app:', debugInfo);
    return false;
  } catch (error) {
    //console.warn('[isMobileApp] Error detecting mobile app platform:', error);
    return false;
  }
};

// Optional: Specific platform checks
export const isIOS = () => isMobileApp() && Capacitor.getPlatform() === 'ios';
export const isAndroid = () => isMobileApp() && Capacitor.getPlatform() === 'android';


// Check if running in iOS webview (including PWA, WebView, Safari)
export const isIOSWebView = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isStandalone = window.navigator.standalone === true;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  
  // Check if in webview (not Safari browser, or is standalone PWA)
  return isIOS && (isStandalone || !isSafari);
};

// Redirect to login with mobile redirect URI
export const mobileLogin = (nextUrl = null) => {
  const redirectUri = isMobileApp() 
    ? MOBILE_REDIRECT_URI 
    : window.location.origin + (nextUrl || '/dashboard');
  
  base44.auth.redirectToLogin(redirectUri);
};

// Handle mobile authentication callback
export const handleMobileAuthCallback = async () => {
  if (!isMobileApp()) return false;

  // Get the URL that opened the app
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token');

  if (accessToken) {
    // Set the token in Base44 client
    await base44.auth.setToken(accessToken);
    
    // Redirect to dashboard or intended page
    const nextUrl = urlParams.get('next') || '/dashboard';
    window.location.href = nextUrl;
    
    return true;
  }

  return false;
};