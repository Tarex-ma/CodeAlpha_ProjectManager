// src/api.js
import axios from 'axios';

/**
 * Fetch the current user's settings.
 * @param {string} token - JWT token.
 * @returns {Promise<Object>}
 */
export const getUserSettings = async (token) => {
  const response = await api.get('auth/me/settings/', {
    // Authorization handled by interceptor
  });
  return response.data;
};

export const updateUserSettings = async (token, data) => {
  const response = await api.patch('auth/me/settings/', data, {
    // Authorization handled by interceptor
  });
  return response.data;
};

export const getUserProfile = async (token) => {
  const response = await api.get('auth/me/', {
    // Authorization handled by interceptor
  });
  return response.data;
};

export const updateUserProfile = async (token, data) => {
  const response = await api.patch('auth/me/update/', data, {
    // Authorization handled by interceptor
  });
  return response.data;
};

// Axios instance for other API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
