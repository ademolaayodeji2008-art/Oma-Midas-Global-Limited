/**
 * AuthContext.jsx — Global authentication context.
 * Provides user state, login, logout, and role helpers.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user on mount
  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await api.post('/api/auth/login', credentials);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout').catch(() => {});
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isMember = user?.role === 'MEMBER';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isMember, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth hook — import from here or from hooks/useAuth.js */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
