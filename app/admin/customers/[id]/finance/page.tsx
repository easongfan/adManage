'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Card, Button, Form, Input, Select, InputNumber, message, Descriptions, Modal, Space, Spin } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';

// 定义交易类型
interface Transaction {
  id: number;
  customer_id: number;
  amount: number;
  type: 'recharge' | 'deduction';
  notes: string;
  transaction_date: string;
}

// 定义客户类型
interface Customer {
  id: number;
  username: string;
  balance: number;
}

// 定义页面参数类型
interface PageParams {
  id: string;
}

export default function CustomerFinancePage({ params }: { params: PageParams }) {
  const router = useRouter();
  const customerId = parseInt(params.id);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取客户财务信息
  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/customers/${customerId}/finance`);
      
      if (!response.ok) {
        throw new Error('获取财务数据失败');
      }

      const data = await response.json();
      setCustomer(data.customer);
      setTransactions(data.transactions);
    } catch (error: any) {
      message.error(error.message || '获取财务数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 首次加载时获取数据
  useEffect(() => {
    if (isNaN(customerId)) {
      message.error('无效的客户ID');
      router.push('/admin/customers');
      return;
    }
    
    fetchFinanceData();
  }, [customerId, router]);

  // 打开交易模态框
  const showTransactionModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const response = await fetch(`/api/admin/customers/${customerId}/finance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '操作失败');
      }

      message.success(values.type === 'recharge' ? '充值成功' : '扣款成功');
      setIsModalVisible(false);
      fetchFinanceData(); // 重新获取财务数据
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 返回客户列表
  const goBack = () => {
    router.push('/admin/customers');
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={goBack}
          style={{ paddingLeft: 0 }}
        >
          返回客户列表
        </Button>
        <h1>客户财务管理</h1>
      </div>

      <Spin spinning={loading}>
        {customer && (
          <Card style={{ marginBottom: 16 }}>
            <Descriptions title="客户信息" bordered>
              <Descriptions.Item label="客户ID">{customer.id}</Descriptions.Item>
              <Descriptions.Item label="用户名">{customer.username}</Descriptions.Item>
              <Descriptions.Item label="账户余额">
                <span style={{ color: Number(customer.balance) < 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>
                  ¥{Number(customer.balance).toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>交易记录</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showTransactionModal}
          >
            新增交易
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={transactions}
          columns={[
            {
              title: '交易ID',
              dataIndex: 'id',
              key: 'id',
            },
            {
              title: '金额',
              dataIndex: 'amount',
              key: 'amount',
              render: (amount) => {
                const numAmount = Number(amount);
                return (
                  <span style={{ color: numAmount < 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                    {numAmount > 0 ? '+' : ''}{numAmount.toFixed(2)}
                  </span>
                );
              },
            },
            {
              title: '类型',
              dataIndex: 'type',
              key: 'type',
              render: (type) => type === 'recharge' ? '充值' : '扣款',
            },
            {
              title: '描述',
              dataIndex: 'notes',
              key: 'notes',
            },
            {
              title: '创建时间',
              dataIndex: 'transaction_date',
              key: 'transaction_date',
              render: (date) => new Date(date).toLocaleString(),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      {/* 新增交易模态框 */}
      <Modal
        title="新增交易"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确认"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="交易类型"
            rules={[{ required: true, message: '请选择交易类型' }]}
            initialValue="recharge"
          >
            <Select>
              <Select.Option value="recharge">充值</Select.Option>
              <Select.Option value="deduction">扣款</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="金额"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              step={100}
              placeholder="请输入金额"
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入交易描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
