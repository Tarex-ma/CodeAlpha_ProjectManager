import api from './axiosInstance';

/**
 * POST /auth/login/
 * @param {{ email: string, password: string }} credentials
 * @returns {{ access, refresh, user }}
 */
export const loginApi = (credentials) =>
  api.post('/auth/login/', credentials);

/**
 * POST /auth/register/
 * @param {{ first_name, last_name, email, password, password_confirm }} data
 * @returns {{ access, refresh, user }}
 */
export const registerApi = (data) =>
  api.post('/auth/register/', data);

/**
 * POST /auth/token/refresh/
 */
export const refreshTokenApi = (refresh) =>
  api.post('/auth/token/refresh/', { refresh });

/**
 * POST /auth/logout/
 */
export const logoutApi = (refresh) =>
  api.post('/auth/logout/', { refresh });

/**
 * GET /auth/me/
 */
export const getMeApi = () =>
  api.get('/auth/me/');