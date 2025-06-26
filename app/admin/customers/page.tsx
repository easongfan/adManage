'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Modal, Form, Spin } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

// 定义客户类型
interface Customer {
  id: number;
  username: string;
  balance: number;
  created_at: string;
  profile?: {
    company_name?: string;
    company_website?: string;
    contact_person?: string;
    mobile_phone?: string;
    contact_qq?: string;
  };
}

// 定义表单数据类型
interface CustomerFormData {
  username: string;
  password?: string;
  company_name?: string;
  company_website?: string;
  contact_person?: string;
  mobile_phone?: string;
  contact_qq?: string;
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm<CustomerFormData>();
  const router = useRouter();

  // 获取客户列表
  const fetchCustomers = async (search: string = '') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) {
        queryParams.append('searchTerm', search);
      }

      const response = await fetch(`/api/admin/customers?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('获取客户列表失败');
      }

      const data = await response.json();
      setCustomers(data);
    } catch (error: any) {
      message.error(error.message || '获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 首次加载时获取客户列表
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 搜索客户
  const handleSearch = () => {
    fetchCustomers(searchTerm);
  };

  // 打开新增客户模态框
  const showAddModal = () => {
    form.resetFields();
    setIsEditing(false);
    setCurrentCustomer(null);
    setIsModalVisible(true);
  };

  // 打开编辑客户模态框
  const showEditModal = (customer: Customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    form.setFieldsValue({
      username: customer.username,
      company_name: customer.profile?.company_name,
      company_website: customer.profile?.company_website,
      contact_person: customer.profile?.contact_person,
      mobile_phone: customer.profile?.mobile_phone,
      contact_qq: customer.profile?.contact_qq,
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
      
      if (isEditing && currentCustomer) {
        // 编辑客户逻辑
        const response = await fetch(`/api/admin/customers/${currentCustomer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '更新客户失败');
        }

        message.success('客户信息已更新');
      } else {
        // 新增客户
        const response = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '创建客户失败');
        }

        message.success('客户创建成功');
      }

      setIsModalVisible(false);
      fetchCustomers(); // 重新获取客户列表
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 跳转到财务管理页面
  const goToFinance = (customerId: number) => {
    router.push(`/admin/customers/${customerId}/finance`);
  };

  // 跳转到广告管理页面
  const goToAds = (customerId: number) => {
    router.push(`/admin/customers/${customerId}/ads`);
  };

  // 删除客户
  const handleDelete = (customerId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？此操作不可逆。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/admin/customers/${customerId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '删除客户失败');
          }

          message.success('客户已成功删除');
          fetchCustomers(); // 重新获取客户列表
        } catch (error: any) {
          message.error(error.message || '删除客户失败');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div>
      <h1>客户管理</h1>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索客户"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            新增客户
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={customers}
        columns={[
          {
            title: '客户ID',
            dataIndex: 'id',
            key: 'id',
          },
          {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
          },
          {
            title: '账户余额',
            dataIndex: 'balance',
            key: 'balance',
            render: (balance) => {
              // 确保balance是数字类型
              const numBalance = typeof balance === 'number' ? balance : Number(balance || 0);
              return (
                <span style={{ color: numBalance < 0 ? 'red' : 'inherit' }}>
                  ¥{numBalance.toFixed(2)}
                </span>
              );
            },
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
            render: (_, record: Customer) => (
              <Space size="small">
                <Button type="link" onClick={() => showEditModal(record)}>编辑</Button>
                <Button type="link" onClick={() => goToFinance(record.id)}>财务管理</Button>
                <Button type="link" onClick={() => goToAds(record.id)}>广告管理</Button>
                <Button type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
              </Space>
            ),
          },
        ]}
        pagination={{ pageSize: 10 }}
      />

      {/* 新增/编辑客户模态框 */}
      <Modal
        title={isEditing ? '编辑客户' : '新增客户'}
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
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={isEditing} />
          </Form.Item>

          {!isEditing && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="company_name"
            label="公司名称"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="company_website"
            label="公司网址"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="contact_person"
            label="联系人"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="mobile_phone"
            label="移动电话"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="contact_qq"
            label="联系QQ"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
