'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  PictureOutlined,
  WalletOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const { Header, Content, Sider } = Layout;

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    setMounted(true);
    // 如果用户未登录或不是客户，重定向到登录页
    if (mounted && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [user, router, mounted]);

  // 在客户端渲染前不显示内容，避免闪烁
  if (!mounted || !user || user.role !== 'customer') {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          广告投放管理平台 - 客户端
        </div>
        <Dropdown
          menu={{
            items: [
              {
                key: 'profile',
                icon: <UserOutlined />,
                label: <Link href="/profile">个人设置</Link>,
              },
              {
                key: 'change-password',
                icon: <LockOutlined />,
                label: <Link href="/change-password">修改密码</Link>,
              },
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
                onClick: () => logout(),
              },
            ],
          }}
        >
          <Button type="text" style={{ color: 'white' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {user?.username}
          </Button>
        </Dropdown>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={200}
          style={{ background: colorBgContainer }}
        >
          <Menu
            mode="inline"
            selectedKeys={[pathname || '']}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '/dashboard',
                icon: <DashboardOutlined />,
                label: <Link href="/dashboard">广告统计</Link>,
              },
              {
                key: '/ads',
                icon: <PictureOutlined />,
                label: <Link href="/ads">广告管理</Link>,
              },
              {
                key: '/finance',
                icon: <WalletOutlined />,
                label: <Link href="/finance">财务明细</Link>,
              },
            ]}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: 280,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
