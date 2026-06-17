import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // simulate checking stored login
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      setUser({ token });
    }

    setIsLoading(false);
  }, []);

  const login = async ({ email, password }) => {
    // fake login (replace later with API)
    const fakeToken = 'demo-token';

    localStorage.setItem('token', fakeToken);
    setUser({ email, token: fakeToken });

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return context;
}