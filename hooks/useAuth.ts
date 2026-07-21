import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  setAccessToken,
  getAccessToken,
  setCurrentUser,
  getCurrentUser,
  clearAuthSession,
  UserSession,
} from '../lib/auth';

// Global promise to deduplicate concurrent refresh requests (e.g. React Strict Mode double mount)
let globalRefreshPromise: Promise<any> | null = null;

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUserState] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt client-side hydration from localStorage on component mount
    const savedUser = getCurrentUser();
    const token = getAccessToken();
    let isTokenValid = false;

    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp && decoded.exp > Date.now() / 1000 + 10) {
        isTokenValid = true;
      }
    }

    if (savedUser) {
      setUserState(savedUser);
      if (isTokenValid) {
        setLoading(false);
        return; // Token is valid, skip network request entirely
      }
      // Token exists but is expired. Call refreshSession (loading stays true)
      refreshSession();
    } else {
      // Guest user. Set loading to false immediately to unlock fields
      setLoading(false);
      // Attempt silent background refresh in case refresh token cookie exists
      refreshSession();
    }
  }, []);

  /**
   * Refreshes the active session.
   */
  async function refreshSession() {
    if (globalRefreshPromise) {
      try {
        await globalRefreshPromise;
        const currentUser = getCurrentUser();
        setUserState(currentUser);
      } catch (err) {
        setUserState(null);
      }
      return;
    }

    const hasSavedUser = !!getCurrentUser();

    try {
      if (hasSavedUser) {
        setLoading(true);
      }
      globalRefreshPromise = api.post('/v1/auth/refresh');
      const response = await globalRefreshPromise;
      const { accessToken, expiresInDays } = response.data.data;
      setAccessToken(accessToken, expiresInDays > 7);
      
      const decoded = decodeJwt(accessToken);
      if (decoded) {
        const userPayload: UserSession = {
          id: decoded.userId,
          email: decoded.email || getCurrentUser()?.email || '',
          role: decoded.role,
          tenantId: decoded.tenantId,
          tenantType: decoded.tenantType,
          subscriptionStatus: decoded.subscriptionStatus || null,
          subscriptionPlan: decoded.subscriptionPlan || null,
          trialEndDate: decoded.trialEndDate || null,
          isTrialExpired: decoded.isTrialExpired || false,
        };
        setCurrentUser(userPayload, expiresInDays > 7);
        setUserState(userPayload);
      } else {
        const currentUser = getCurrentUser();
        setUserState(currentUser);
      }
      setError(null);
    } catch (err: any) {
      // Refresh failed, meaning session was either absent or expired
      clearAuthSession();
      setUserState(null);
    } finally {
      if (hasSavedUser) {
        setLoading(false);
      }
      globalRefreshPromise = null;
    }
  }

  /**
   * Performs credentials login.
   */
  const login = async (email: string, passwordPlain: string, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/v1/auth/login', {
        email,
        password: passwordPlain,
        rememberMe,
      });

      const { accessToken, refreshToken, user: loggedUser, expiresInDays } = response.data.data;

      // Store tokens and set state
      setAccessToken(accessToken, expiresInDays > 7);
      
      const userPayload: UserSession = {
        id: loggedUser.id,
        email: loggedUser.email,
        role: loggedUser.role,
        tenantId: loggedUser.tenantId,
        tenantType: loggedUser.tenantType,
        subscriptionStatus: loggedUser.subscriptionStatus || null,
        subscriptionPlan: loggedUser.subscriptionPlan || null,
        trialEndDate: loggedUser.trialEndDate || null,
        isTrialExpired: loggedUser.isTrialExpired || false,
      };

      setCurrentUser(userPayload, expiresInDays > 7);
      setUserState(userPayload);
      
      return userPayload;
    } catch (err: any) {
      const errMsg = err.response?.data?.errorDetails?.message || 
                     err.response?.data?.error?.message || 
                     (typeof err.response?.data?.error === 'string' ? err.response.data.error : null) || 
                     'Login failed. Please verify credentials.';
      setError(errMsg);
      throw err; // Propagate original error to allow checking error.response.data.error.code
    } finally {
      setLoading(false);
    }
  };

  /**
   * Performs user logout.
   */
  const logout = async () => {
    try {
      setLoading(true);
      
      // Attempt to hit the invalidate endpoint
      await api.post('/v1/auth/logout', {}).catch(() => {});

      clearAuthSession();
      setUserState(null);
      setError(null);

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      clearAuthSession();
      setUserState(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
  };
}
export default useAuth;
