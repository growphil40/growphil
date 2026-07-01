export interface UserSession {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenantType: 'agency' | 'client';
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  trialEndDate?: string | null;
  isTrialExpired?: boolean;
}

let accessToken = '';
let currentUser: UserSession | null = null;

/**
 * Stores the JWT access token in memory.
 */
export function setAccessToken(token: string) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      document.cookie = `accessToken=${token}; path=/; max-age=900; SameSite=Strict; Secure`;
    } else {
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure';
    }
  }
}

export function getAccessToken(): string {
  if (!accessToken && typeof window !== 'undefined') {
    const match = document.cookie.match(/(^|;)\s*accessToken\s*=\s*([^;]+)/);
    if (match) {
      accessToken = match[2];
    }
  }
  return accessToken;
}

/**
 * Stores the authenticated user profile in memory.
 */
export function setCurrentUser(user: UserSession | null, rememberMe = false) {
  currentUser = user;
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('growphil_user', JSON.stringify(user));
      const maxAge = rememberMe ? 180 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      document.cookie = `growphil_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
    } else {
      localStorage.removeItem('growphil_user');
      document.cookie = 'growphil_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure';
    }
  }
}

/**
 * Retrieves the authenticated user profile from memory or localStorage fallback.
 */
export function getCurrentUser(): UserSession | null {
  if (currentUser) return currentUser;
  
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('growphil_user');
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
        return currentUser;
      } catch {
        localStorage.removeItem('growphil_user');
      }
    }
  }
  return null;
}

/**
 * Wipes memory session parameters on logout.
 */
export function clearAuthSession() {
  accessToken = '';
  currentUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('growphil_user');
    document.cookie = 'growphil_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}
