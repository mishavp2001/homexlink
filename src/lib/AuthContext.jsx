import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUserProfile, logoutCurrentUser } from '@/api/base44Client';
import { buildLoginUrl } from '@/lib/login-route';
import { restorePostLoginRedirect } from '@/utils/mobileAuth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    setAppPublicSettings(null);

    try {
      await checkUserAuth({ suppressAuthError: true });
    } finally {
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async ({ suppressAuthError = false } = {}) => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await getCurrentUserProfile();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      restorePostLoginRedirect();
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      
      // If user auth fails, it might be an expired token
      if (!suppressAuthError && (error.status === 401 || error.status === 403)) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      void logoutCurrentUser(window.location.href);
    } else {
      // Just remove the token without redirect
      void logoutCurrentUser();
    }
  };

  const navigateToLogin = (nextUrl = null) => {
    const targetUrl = nextUrl || window.location.href;
    window.location.assign(buildLoginUrl(targetUrl));
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
