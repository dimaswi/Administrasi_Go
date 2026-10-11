import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  nip: string;
  role_id: number | null;
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: [],
  loading: true,
  isAdmin: false,
  hasPermission: () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setPermissions(response.data.permissions || []);
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const isAdmin = user
    ? Number(user.role_id) === 1 || Number(user.role_id) === 7 || permissions.includes('*')
    : false;

  const hasPermission = (permission: string) => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPermissions([]);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, isAdmin, hasPermission, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
