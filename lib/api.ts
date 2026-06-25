import axios from 'axios';
import { getAccessToken, setAccessToken, clearAuthSession } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies (like httpOnly refresh tokens) are sent with requests
  withCredentials: true,
});

// Flag to track token refreshing state
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Request Interceptor to attach Bearer Access Token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to intercept 401s and execute Token Rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Security compatibility layer: translate backend's string error responses to objects
    if (error.response?.data && typeof error.response.data.error === 'string') {
      error.response.data.error = { message: error.response.data.error };
    }

    const originalRequest = error.config;

    // Guard: only attempt refresh if it is a 401, has not been retried, and is not a login or refresh attempt
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[API Client] Access token expired. Attempting rotation...');
        
        // Post to refresh token endpoint. Cookie auto-attached by browser.
        const response = await axios.post(
          `${API_URL}/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        setAccessToken(accessToken);

        // Retry queued failed requests
        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        console.warn('[API Client] Refresh token rotation failed. Clearing session.');
        clearAuthSession();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
