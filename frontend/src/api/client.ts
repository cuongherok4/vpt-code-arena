import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const API_BASE_URL = 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken, user } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (user?.id) {
    config.headers['X-User-Id'] = user.id;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const canRefresh = error.response?.status === 401
      && !originalRequest?._retry
      && !originalRequest?.url?.includes('/auth/');

    if (canRefresh) {
      originalRequest._retry = true;
      const refreshed = await useAuthStore.getState().refresh();
      if (refreshed) {
        originalRequest.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
        return apiClient(originalRequest);
      }
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
