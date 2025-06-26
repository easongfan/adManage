'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();

  useEffect(() => {
    // 如果用户未登录，重定向到登录页面
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    // 如果用户已登录，根据角色重定向到相应页面
    if (user?.role === 'admin') {
      router.push('/admin/customers');
    } else {
      router.push('/dashboard');
    }
  }, [isLoggedIn, user, router]);

  // 返回一个加载中的界面，因为这个页面会立即重定向
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      正在加载...
    </div>
  );
}
