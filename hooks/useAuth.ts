'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, User } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface UseAuthReturn {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, isLoggedIn, login, logout: storeLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 客户端加载完成后，设置loading状态为false
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 扩展logout功能，包括API调用和重定向
  const logout = async (): Promise<void> => {
    try {
      // 调用登出API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 更新store状态
      storeLogout();
      
      // 重定向到登录页
      router.push('/login');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使API调用失败，也清除本地状态
      storeLogout();
      router.push('/login');
    }
  };

  return {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
  };
}
