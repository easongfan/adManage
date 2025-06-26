import './globals.css';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '广告平台',
  description: '广告投放管理平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ConfigProvider locale={zhCN}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
