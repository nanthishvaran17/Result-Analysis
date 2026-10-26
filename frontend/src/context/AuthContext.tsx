import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const profile = await api.get<User>('/auth/me');
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/login', {
      username,
      password,
    });
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'EXAM_STAFF';
  const isViewer = user?.role === 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAdmin,
        isStaff,
        isViewer,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
