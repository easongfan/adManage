'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Card, 
  Spin, 
  Empty, 
  Typography,
  Pagination
} from 'antd';
import { useAuth } from '@/hooks/useAuth';

const { Title } = Typography;

// 交易类型映射
const transactionTypeMap = {
  recharge: '充值',
  deduction: '扣款',
};

// 交易状态映射
const transactionStatusMap = {
  pending: '处理中',
  completed: '已完成',
  failed: '失败',
};

// 状态颜色映射
const statusColors = {
  pending: 'orange',
  completed: 'green',
  failed: 'red',
};

interface Transaction {
  id: number;
  amount: string;
  type: 'recharge' | 'deduction';
  status: 'pending' | 'completed' | 'failed';
  note: string;
  created_at: string;
}

interface PaginationData {
  current: number;
  pageSize: number;
  total: number;
}

const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取财务记录
  const fetchTransactions = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/transactions?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) {
        throw new Error('获取财务记录失败');
      }
      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('获取财务记录错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    fetchTransactions(page, pageSize || pagination.pageSize);
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (date: string) => new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: Transaction) => {
        const value = parseFloat(amount);
        const isPositive = record.type === 'recharge';
        return (
          <span style={{ color: isPositive ? '#3f8600' : '#cf1322' }}>
            {isPositive ? '+' : '-'}¥{Math.abs(value).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => transactionTypeMap[type as keyof typeof transactionTypeMap] || type
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status as keyof typeof statusColors]}>
          {transactionStatusMap[status as keyof typeof transactionStatusMap] || status}
        </Tag>
      )
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true
    }
  ];

  return (
    <div>
      <Title level={2}>财务明细</Title>
      
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={transactions.map(tx => ({ ...tx, key: tx.id }))}
              pagination={false}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger
                showTotal={(total) => `共 ${total} 条记录`}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无财务记录" />
        )}
      </Card>
    </div>
  );
};

export default FinancePage;
