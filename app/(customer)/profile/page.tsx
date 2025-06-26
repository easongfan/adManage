'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';

interface ProfileForm {
  username: string;
  company_name: string;
  company_website: string;
  contact_name: string;
  contact_phone: string;
  contact_qq: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 获取用户资料
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('获取个人资料失败');
        }
        const data = await response.json();
        
        // 填充表单数据
        form.setFieldsValue({
          username: data.username || '',
          company_name: data.company_name || '',
          company_website: data.company_website || '',
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          contact_qq: data.contact_qq || '',
        });
      } catch (error) {
        console.error('获取个人资料错误:', error);
        message.error('获取个人资料失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, form]);

  // 提交表单
  const handleSubmit = async (values: ProfileForm) => {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('更新个人资料失败');
      }

      message.success('个人资料更新成功');
    } catch (error) {
      console.error('更新个人资料错误:', error);
      message.error('更新个人资料失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '24px' }}>个人设置</h1>
      
      <Card title="个人信息" bordered={false}>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ maxWidth: '600px' }}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input disabled placeholder="用户名" />
            </Form.Item>

            <Form.Item
              name="company_name"
              label="公司名称"
              rules={[{ required: true, message: '请输入公司名称' }]}
            >
              <Input placeholder="请输入您的公司名称" />
            </Form.Item>

            <Form.Item
              name="company_website"
              label="公司网址"
              rules={[
                { required: false },
                { type: 'url', message: '请输入有效的网址' }
              ]}
            >
              <Input placeholder="请输入您的公司网址" />
            </Form.Item>

            <Form.Item
              name="contact_name"
              label="联系人"
              rules={[{ required: true, message: '请输入联系人姓名' }]}
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>

            <Form.Item
              name="contact_phone"
              label="移动电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>

            <Form.Item
              name="contact_qq"
              label="联系QQ"
              rules={[
                { required: false },
                { pattern: /^\d+$/, message: 'QQ号码只能包含数字' }
              ]}
            >
              <Input placeholder="请输入联系QQ" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
              >
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default ProfilePage;
