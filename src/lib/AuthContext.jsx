import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import Login from '@/components/Login';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const me = await base44.auth.me();
      setUser(me);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status && error.status !== 401) {
        setAuthError({ type: 'unknown', message: error.message });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const logout = () => base44.auth.logout();
  const navigateToLogin = () => base44.auth.redirectToLogin();

  const value = {
    user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings: false, authError,
    appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth,
  };

  let content;
  if (!authChecked) {
    content = (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xs tracking-widest uppercase text-cyan-500/60 animate-pulse">Loading Clara.ai...</div>
      </div>
    );
  } else if (!isAuthenticated) {
    content = <Login onAuthenticated={checkUserAuth} serverError={authError?.message} />;
  } else {
    content = children;
  }

  return <AuthContext.Provider value={value}>{content}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
