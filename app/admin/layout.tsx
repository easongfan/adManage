'use client';

import { useEffect, useState } from 'react';
import { Layout, Menu, theme, Spin } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import {
  UserOutlined,
  DollarOutlined,
  PictureOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = theme.useToken();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // 路由守卫
  useEffect(() => {
    // 检查用户是否已登录且是管理员
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [isLoggedIn, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          广告平台管理后台
        </div>
        <div style={{ color: 'white' }}>
          欢迎，{user?.username}
          <LogoutOutlined 
            onClick={handleLogout} 
            style={{ marginLeft: 16, cursor: 'pointer' }} 
          />
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: token.colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname || '']}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '/admin/customers',
                icon: <UserOutlined />,
                label: <Link href="/admin/customers">客户管理</Link>,
              },
              // {
              //   key: '/admin/finance',
              //   icon: <DollarOutlined />,
              //   label: <Link href="/admin/finance">财务管理</Link>,
              // },
              // {
              //   key: '/admin/ads',
              //   icon: <PictureOutlined />,
              //   label: <Link href="/admin/ads">广告管理</Link>,
              // },
            ]}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
