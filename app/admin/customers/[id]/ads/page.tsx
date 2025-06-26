'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Card, Button, Form, Input, Select, InputNumber, message, Modal, Tag, Space, Spin } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

// 定义广告类型
interface Ad {
  id: number;
  customer_id: number;
  name: string;
  status: 'active' | 'paused';
  unit_price: number | null;
  billing_type: string | null;
  ad_format: string | null;
  budget: number | null;
  platform: string | null;
  created_at: string;
}

// 定义客户类型
interface Customer {
  id: number;
  username: string;
}

// 定义页面参数类型
interface PageParams {
  id: string;
}

export default function CustomerAdsPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const customerId = parseInt(params.id);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [form] = Form.useForm();

  // 获取客户广告列表
  const fetchAdsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/customers/${customerId}/ads`);
      
      if (!response.ok) {
        throw new Error('获取广告数据失败');
      }

      const data = await response.json();
      setAds(data.ads);

      // 获取客户信息
      const customerResponse = await fetch(`/api/admin/customers/${customerId}`);
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        setCustomer(customerData.customer);
      }
    } catch (error: any) {
      message.error(error.message || '获取广告数据失败');
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
    
    fetchAdsData();
  }, [customerId, router]);

  // 打开新增广告模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentAd(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑广告模态框
  const showEditModal = (ad: Ad) => {
    setIsEditMode(true);
    setCurrentAd(ad);
    form.setFieldsValue({
      name: ad.name,
      status: ad.status,
      unit_price: ad.unit_price,
      billing_type: ad.billing_type,
      ad_format: ad.ad_format,
      budget: ad.budget,
      platform: ad.platform,
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
      
      if (isEditMode && currentAd) {
        // 编辑广告
        const response = await fetch(`/api/admin/customers/${customerId}/ads/${currentAd.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '更新广告失败');
        }

        message.success('广告更新成功');
      } else {
        // 新增广告
        const response = await fetch(`/api/admin/customers/${customerId}/ads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '创建广告失败');
        }

        message.success('广告创建成功');
      }

      setIsModalVisible(false);
      fetchAdsData(); // 重新获取广告数据
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除广告
  const handleDelete = async (adId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个广告吗？相关的消费记录也将被删除。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/admin/customers/${customerId}/ads/${adId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '删除广告失败');
          }

          message.success('广告删除成功');
          fetchAdsData(); // 重新获取广告数据
        } catch (error: any) {
          message.error(error.message || '删除广告失败');
        }
      },
    });
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
        <h1>客户广告管理</h1>
      </div>

      <Spin spinning={loading}>
        {customer && (
          <Card style={{ marginBottom: 16 }}>
            <p><strong>客户ID:</strong> {customer.id}</p>
            <p><strong>用户名:</strong> {customer.username}</p>
          </Card>
        )}

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>广告列表</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showAddModal}
          >
            新增广告
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={ads}
          columns={[
            {
              title: '广告ID',
              dataIndex: 'id',
              key: 'id',
            },
            {
              title: '广告名称',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'orange'}>
                  {status === 'active' ? '活跃' : '暂停'}
                </Tag>
              ),
            },
            {
              title: '单价',
              dataIndex: 'unit_price',
              key: 'unit_price',
              render: (price) => price ? `¥${Number(price).toFixed(2)}` : '-',
            },
            {
              title: '计费类型',
              dataIndex: 'billing_type',
              key: 'billing_type',
              render: (type) => type || '-',
            },
            {
              title: '预算',
              dataIndex: 'budget',
              key: 'budget',
              render: (budget) => budget ? `¥${Number(budget).toFixed(2)}` : '-',
            },
            {
              title: '平台',
              dataIndex: 'platform',
              key: 'platform',
              render: (platform) => platform || '-',
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date) => new Date(date).toLocaleString(),
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record: Ad) => (
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
                    onClick={() => router.push(`/admin/customers/${customerId}/ads/${record.id}/spend-logs`)}
                  >
                    消耗管理
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

      {/* 广告表单模态框 */}
      <Modal
        title={isEditMode ? '编辑广告' : '新增广告'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="广告名称"
            rules={[{ required: true, message: '请输入广告名称' }]}
          >
            <Input placeholder="请输入广告名称" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="paused"
          >
            <Select>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="paused">暂停</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="unit_price"
            label="单价"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              step={0.1}
              placeholder="请输入单价"
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item
            name="billing_type"
            label="计费类型"
          >
            <Input placeholder="请输入计费类型，如CPC、CPM等" />
          </Form.Item>

          <Form.Item
            name="ad_format"
            label="广告格式"
          >
            <Input placeholder="请输入广告格式，如横幅、视频等" />
          </Form.Item>

          <Form.Item
            name="budget"
            label="预算"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              step={100}
              placeholder="请输入预算"
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item
            name="platform"
            label="投放平台"
          >
            <Select allowClear placeholder="请选择投放平台">
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
