import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('hostelToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
    } catch {
      localStorage.removeItem('hostelToken');
      localStorage.removeItem('hostelUser');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('hostelToken', data.data.token);
    localStorage.setItem('hostelUser', JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem('hostelToken');
    localStorage.removeItem('hostelUser');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isResident = user?.role === 'resident';
  const canManage = isAdmin || isStaff;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser, isAdmin, isStaff, isResident, canManage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
