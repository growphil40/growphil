import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  setAccessToken,
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
    // Attempt to hydrate user on component mount
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUserState(savedUser);
    }
    // Attempt to silently refresh token on load to establish in-memory session
    refreshSession();
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

    try {
      setLoading(true);
      globalRefreshPromise = api.post('/v1/auth/refresh');
      const response = await globalRefreshPromise;
      const { accessToken } = response.data.data;
      setAccessToken(accessToken);
      
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
        setCurrentUser(userPayload);
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
      setLoading(false);
      globalRefreshPromise = null;
    }
  }

  /**
   * Performs credentials login.
   */
  const login = async (email: string, passwordPlain: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/v1/auth/login', {
        email,
        password: passwordPlain,
      });

      const { accessToken, refreshToken, user: loggedUser } = response.data.data;

      // Store tokens and set state
      setAccessToken(accessToken);
      
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

      setCurrentUser(userPayload);
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
