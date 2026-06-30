// src/auth.js
import api from './api';

export const login = async (email, password) => {
  const response = await api.post('token/', { username: email, password });
  const { access, refresh } = response.data;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = () => !!localStorage.getItem('access_token');
