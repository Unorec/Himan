import { useState, useCallback } from 'react';
import { auth } from '@/services/auth';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = useCallback(async (credentials) => {
    try {
      const result = await auth.login(credentials);
      setIsLoggedIn(true);
      return result;
    } catch (error) {
      console.error('登入失敗:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth.logout();
      setIsLoggedIn(false);
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    }
  }, []);

  return { isLoggedIn, login, logout };
};