'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Card, Button, Form, Input, Select, InputNumber, DatePicker, message, Modal, Space, Spin } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// 定义广告消耗记录类型
interface SpendLog {
  id: number;
  ad_id: number;
  customer_id: number;
  amount: string;
  platform: string;
  spend_date: string;
  created_at: string;
}

// 定义广告类型
interface Ad {
  id: number;
  name: string;
  customer_id: number;
}

// 定义客户类型
interface Customer {
  id: number;
  username: string;
  balance: string | null;
}

// 定义页面参数类型
interface PageParams {
  id: string;
  adId: string;
}

export default function AdSpendLogsPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const customerId = parseInt(params.id);
  const adId = parseInt(params.adId);
  
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [spendLogs, setSpendLogs] = useState<SpendLog[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSpendLog, setCurrentSpendLog] = useState<SpendLog | null>(null);
  const [form] = Form.useForm();

  // 获取广告消耗记录数据
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 获取广告信息
      const adResponse = await fetch(`/api/admin/customers/${customerId}/ads/${adId}`);
      if (!adResponse.ok) {
        throw new Error('获取广告信息失败');
      }
      const adData = await adResponse.json();
      setAd(adData.ad);

      // 获取客户信息
      const customerResponse = await fetch(`/api/admin/customers/${customerId}`);
      if (!customerResponse.ok) {
        throw new Error('获取客户信息失败');
      }
      const customerData = await customerResponse.json();
      setCustomer(customerData.customer);

      // 获取广告消耗记录
      // 注意：这里假设我们有一个API来获取特定广告的消耗记录
      // 如果没有，我们可以在前端过滤所有消耗记录
      const spendLogsResponse = await fetch(`/api/admin/customers/${customerId}/ads/${adId}/spend-logs`);
      if (spendLogsResponse.ok) {
        const spendLogsData = await spendLogsResponse.json();
        setSpendLogs(spendLogsData.spendLogs || []);
      } else {
        // 如果API不存在，我们可以设置一个空数组
        setSpendLogs([]);
      }
    } catch (error: any) {
      message.error(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 首次加载时获取数据
  useEffect(() => {
    if (isNaN(customerId) || isNaN(adId)) {
      message.error('无效的ID参数');
      router.push('/admin/customers');
      return;
    }
    
    fetchData();
  }, [customerId, adId, router]);

  // 打开新增消耗记录模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentSpendLog(null);
    form.resetFields();
    form.setFieldsValue({
      spend_date: dayjs(),
    });
    setIsModalVisible(true);
  };

  // 打开编辑消耗记录模态框
  const showEditModal = (spendLog: SpendLog) => {
    setIsEditMode(true);
    setCurrentSpendLog(spendLog);
    form.setFieldsValue({
      amount: parseFloat(spendLog.amount),
      platform: spendLog.platform,
      spend_date: dayjs(spendLog.spend_date),
    });
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
      
      if (isEditMode && currentSpendLog) {
        // 编辑消耗记录
        // 注意：由于我们的API设计，编辑消耗记录需要先删除旧记录再创建新记录
        // 这是因为消耗记录会影响客户余额，编辑需要重新计算
        
        // 先删除旧记录
        const deleteResponse = await fetch(`/api/admin/spend-logs/${currentSpendLog.id}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json();
          throw new Error(errorData.error || '删除旧消耗记录失败');
        }

        // 再创建新记录
        const createResponse = await fetch('/api/admin/spend-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ad_id: adId,
            customer_id: customerId,
            amount: values.amount,
            platform: values.platform,
            spend_date: values.spend_date.format('YYYY-MM-DD'),
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || '创建新消耗记录失败');
        }

        message.success('消耗记录更新成功');
      } else {
        // 创建新消耗记录
        const response = await fetch('/api/admin/spend-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ad_id: adId,
            customer_id: customerId,
            amount: values.amount,
            platform: values.platform,
            spend_date: values.spend_date.format('YYYY-MM-DD'),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '创建消耗记录失败');
        }

        message.success('消耗记录创建成功');
      }

      setIsModalVisible(false);
      fetchData(); // 重新获取数据
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除消耗记录
  const handleDelete = async (spendLogId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条消耗记录吗？删除后将返还相应金额到客户余额。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/admin/spend-logs/${spendLogId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '删除消耗记录失败');
          }

          message.success('消耗记录删除成功');
          fetchData(); // 重新获取数据
        } catch (error: any) {
          message.error(error.message || '删除消耗记录失败');
        }
      },
    });
  };

  // 返回广告列表
  const goBack = () => {
    router.push(`/admin/customers/${customerId}/ads`);
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
          返回广告列表
        </Button>
        <h1>广告消耗管理</h1>
      </div>

      <Spin spinning={loading}>
        {ad && customer && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p><strong>广告ID:</strong> {ad.id}</p>
                <p><strong>广告名称:</strong> {ad.name}</p>
              </div>
              <div>
                <p><strong>客户ID:</strong> {customer.id}</p>
                <p><strong>客户名称:</strong> {customer.username}</p>
                <p><strong>客户余额:</strong> ¥{parseFloat(customer.balance || '0').toFixed(2)}</p>
              </div>
            </div>
          </Card>
        )}

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>消耗记录列表</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showAddModal}
          >
            新增消耗记录
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={spendLogs}
          columns={[
            {
              title: '记录ID',
              dataIndex: 'id',
              key: 'id',
            },
            {
              title: '消耗日期',
              dataIndex: 'spend_date',
              key: 'spend_date',
              render: (date) => new Date(date).toLocaleDateString(),
            },
            {
              title: '消耗金额',
              dataIndex: 'amount',
              key: 'amount',
              render: (amount) => `¥${parseFloat(amount).toFixed(2)}`,
            },
            {
              title: '消耗平台',
              dataIndex: 'platform',
              key: 'platform',
            },
            {
              title: '录入时间',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date) => new Date(date).toLocaleString(),
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record: SpendLog) => (
                <Space size="middle">
                  <Button 
                    type="link" 
                    icon={<EditOutlined />} 
                    onClick={() => showEditModal(record)}
                  >
                    编辑
                  </Button>
                  <Button 
                    type="link" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(record.id)}
                  >
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      {/* 消耗记录表单模态框 */}
      <Modal
        title={isEditMode ? '编辑消耗记录' : '新增消耗记录'}
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
            name="spend_date"
            label="消耗日期"
            rules={[{ required: true, message: '请选择消耗日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="amount"
            label="消耗金额"
            rules={[
              { required: true, message: '请输入消耗金额' },
              { type: 'number', min: 0.01, message: '消耗金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              step={0.1}
              placeholder="请输入消耗金额"
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item
            name="platform"
            label="消耗平台"
            rules={[{ required: true, message: '请选择消耗平台' }]}
          >
            <Select placeholder="请选择消耗平台">
              <Select.Option value="iOS">iOS</Select.Option>
              <Select.Option value="Android">Android</Select.Option>
              <Select.Option value="WeChat">微信</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
