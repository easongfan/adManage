'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Card, 
  Spin, 
  Empty, 
  Typography,
  Badge
} from 'antd';
import { useAuth } from '@/hooks/useAuth';

const { Title } = Typography;

// 广告状态标签颜色映射
const statusColors = {
  active: 'green',
  paused: 'orange',
};

// 计费类型映射
const billingTypeMap = {
  CPM: '千次展示',
  CPC: '点击',
  CPD: '天',
};

// 广告形式映射
const adTypeMap = {
  Banner: '横幅',
  Video: '视频',
  Native: '原生',
  Interstitial: '插屏',
};

// 平台映射
const platformMap = {
  WeChat: '微信',
  Weibo: '微博',
  Douyin: '抖音',
  Bilibili: 'B站',
  Other: '其他',
};

interface Ad {
  id: number;
  name: string;
  status: 'active' | 'paused';
  price_per_thousand: string;
  billing_type: string;
  ad_type: string;
  budget: string;
  platform: string;
  totalSpend: string;
  todaySpend: string;
  created_at: string;
}

const AdsPage: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取广告列表
  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ads');
      if (!response.ok) {
        throw new Error('获取广告列表失败');
      }
      const data = await response.json();
      setAds(data.ads);
    } catch (error) {
      console.error('获取广告列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    if (user) {
      fetchAds();
    }
  }, [user]);

  // 表格列定义
  const columns = [
    {
      title: '广告ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '广告名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '广告状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status as keyof typeof statusColors]}>
          {status === 'active' ? '运行中' : '已暂停'}
        </Tag>
      ),
    },
    {
      title: '单价(千次)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price: string) => `¥${parseFloat(price).toFixed(2)}`,
    },
    {
      title: '计费类型',
      dataIndex: 'billing_type',
      key: 'billing_type',
      width: 100,
      render: (type: string) => billingTypeMap[type as keyof typeof billingTypeMap] || type,
    },
    {
      title: '广告形式',
      dataIndex: 'ad_type',
      key: 'ad_type',
      width: 100,
      render: (type: string) => adTypeMap[type as keyof typeof adTypeMap] || type,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 100,
      render: (budget: string) => `¥${parseFloat(budget).toFixed(2)}`,
    },
    {
      title: '总消耗',
      dataIndex: 'totalSpend',
      key: 'totalSpend',
      width: 100,
      render: (spend: string) => `¥${parseFloat(spend).toFixed(2)}`,
    },
    {
      title: '今日消耗',
      dataIndex: 'todaySpend',
      key: 'todaySpend',
      width: 100,
      render: (spend: string) => {
        const amount = parseFloat(spend);
        return (
          <span style={{ color: amount > 0 ? '#cf1322' : 'inherit' }}>
            ¥{amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '应用平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => platformMap[platform as keyof typeof platformMap] || platform,
    },
  ];

  return (
    <div>
      <Title level={2}>广告管理</Title>
      
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : ads.length > 0 ? (
          <Table
            columns={columns}
            dataSource={ads.map(ad => ({ ...ad, key: ad.id }))}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        ) : (
          <Empty description="暂无广告数据" />
        )}
      </Card>
    </div>
  );
};

export default AdsPage;
