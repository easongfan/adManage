'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { LockOutlined } from '@ant-design/icons';

interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordPage = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 提交表单
  const handleSubmit = async (values: PasswordForm) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '修改密码失败');
      }

      message.success('密码修改成功');
      form.resetFields();
    } catch (error: any) {
      console.error('修改密码错误:', error);
      message.error(error.message || '修改密码失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '24px' }}>修改密码</h1>
      
      <Card title="安全设置" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: '400px' }}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入新密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请再次输入新密码"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '20px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
