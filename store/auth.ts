import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 定义用户类型
export type User = {
  id: number;
  username: string;
  role: 'admin' | 'customer';
  balance?: number;
};

// 定义认证状态类型
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// 创建认证状态存储
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user: User) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-storage', // 本地存储的键名
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
);
