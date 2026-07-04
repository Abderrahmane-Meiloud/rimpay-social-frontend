import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [token, setTokenState] = useState(authService.getToken());
  const [isLoading, setIsLoading] = useState(!!authService.getToken());

  const isAuthenticated = !!user && !!token;

  const refreshMe = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
      setRoles(data.roles);
      setPermissions(data.permissions);
    } catch {
      authService.clearToken();
      setTokenState(null);
      setUser(null);
      setRoles([]);
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      refreshMe().finally(() => setIsLoading(false));
    }
  }, [token, refreshMe]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setTokenState(data.accessToken);
    setUser(data.user);
    setRoles(data.roles);
    setPermissions(data.permissions);
  };

  const logout = () => {
    authService.logout();
    setTokenState(null);
    setUser(null);
    setRoles([]);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{ user, roles, permissions, token, isAuthenticated, isLoading, login, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
