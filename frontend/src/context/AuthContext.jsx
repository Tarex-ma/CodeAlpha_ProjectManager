import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { loginApi, registerApi, logoutApi } from '../api/authApi';
import {
  getAccessToken,
  getStoredUser,
  getRefreshToken,
  setTokens,
  setStoredUser,
  clearAuth,
  isTokenExpired,
} from '../utils/tokenUtils';

/* ─── State shape ──────────────────────────────────────────────── */
const initialState = {
  user:            getStoredUser(),
  isAuthenticated: !!getAccessToken() && !isTokenExpired(getAccessToken()),
  isLoading:       false,
  error:           null,
};

/* ─── Reducer ──────────────────────────────────────────────────── */
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, isLoading: false, user: action.payload, isAuthenticated: true, error: null };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, user: null, isAuthenticated: false, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

/* ─── Context ──────────────────────────────────────────────────── */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /* Validate token on mount */
  useEffect(() => {
    const token = getAccessToken();
    if (token && isTokenExpired(token)) {
      clearAuth();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /* ── login ── */
  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await loginApi(credentials);
      setTokens(data.tokens.access, data.tokens.refresh);
      setStoredUser(data.user);
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, error: message };
    }
  }, []);

  /* ── register ── */
  const register = useCallback(async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await registerApi(userData);
      setTokens(data.tokens.access, data.tokens.refresh);
      setStoredUser(data.user);
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, error: message };
    }
  }, []);

  /* ── logout ── */
  const logout = useCallback(async () => {
    try { await logoutApi(getRefreshToken()); } catch { /* ignore */ }
    clearAuth();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

/* ─── Helper ───────────────────────────────────────────────────── */
function extractError(err) {
  if (!err.response) return 'Network error. Please check your connection.';
  const { data, status } = err.response;
  if (status === 401) return 'Invalid email or password.';
  if (status === 400) {
    if (typeof data === 'object') {
      const first = Object.values(data)[0];
      return Array.isArray(first) ? first[0] : String(first);
    }
  }
  if (status === 429) return 'Too many attempts. Please wait a moment.';
  if (status >= 500) return 'Server error. Please try again later.';
  return data?.detail || data?.message || 'Something went wrong.';
}
