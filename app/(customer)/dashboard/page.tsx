'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  DatePicker, 
  Select, 
  Form, 
  Button, 
  Spin, 
  Empty 
} from 'antd';
import { 
  DollarOutlined, 
  CalendarOutlined, 
  LineChartOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';
import { Line } from '@ant-design/plots';

const { RangePicker } = DatePicker;

interface SummaryData {
  balance: string;
  todaySpend: string;
  weekSpend: string;
  last7DaysSpend: string;
}

interface DetailData {
  date: string;
  amount: string;
}

interface AdOption {
  value: number;
  label: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [detailData, setDetailData] = useState<DetailData[]>([]);
  const [adOptions, setAdOptions] = useState<AdOption[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [form] = Form.useForm();

  // 获取统计摘要数据
  const fetchSummaryData = async () => {
    try {
      setLoadingSummary(true);
      const response = await fetch('/api/statistics/summary');
      if (!response.ok) {
        throw new Error('获取统计摘要失败');
      }
      const data = await response.json();
      setSummaryData(data);
    } catch (error) {
      console.error('获取统计摘要错误:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  // 获取广告列表作为筛选选项
  const fetchAdOptions = async () => {
    try {
      const response = await fetch('/api/ads');
      if (!response.ok) {
        throw new Error('获取广告列表失败');
      }
      const data = await response.json();
      const options = data.ads.map((ad: any) => ({
        value: ad.id,
        label: ad.name
      }));
      setAdOptions(options);
    } catch (error) {
      console.error('获取广告列表错误:', error);
    }
  };

  // 获取统计详情数据
  const fetchDetailData = async (values: any) => {
    try {
      setLoadingDetails(true);
      const { dateRange, platform, adId } = values;
      
      let queryParams = new URLSearchParams();
      if (dateRange && dateRange[0] && dateRange[1]) {
        queryParams.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        queryParams.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }
      if (platform) {
        queryParams.append('platform', platform);
      }
      if (adId) {
        queryParams.append('adId', adId.toString());
      }
      
      const response = await fetch(`/api/statistics/details?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('获取统计详情失败');
      }
      const rawData = await response.json();
      
      // 处理数据，确保amount字段为数字类型
      const processedData = rawData.map((item: any) => ({
        ...item,
        amount: parseFloat(item.amount), // 将字符串转换为数字
      }));
      
      setDetailData(processedData);
    } catch (error) {
      console.error('获取统计详情错误:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    if (user) {
      fetchSummaryData();
      fetchAdOptions();
      
      // 默认加载最近30天的数据
      const defaultValues = {
        dateRange: [dayjs().subtract(30, 'day'), dayjs()]
      };
      form.setFieldsValue(defaultValues);
      fetchDetailData(defaultValues);
    }
  }, [user, form]);

  // 处理筛选表单提交
  const handleFilterSubmit = (values: any) => {
    fetchDetailData(values);
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '消耗金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text: string) => `¥${parseFloat(text).toFixed(2)}`
    }
  ];

  // 图表配置
  const chartConfig = {
    data: detailData,
    padding: 'auto',
    xField: 'date',
    yField: 'amount',
    xAxis: {
      type: 'time',
    },
    yAxis: {
      nice: true,
      sort: true,
      min: 0, // 从0开始
      tickCount: 5, // 控制刻度数量，使分布更均匀
    },
    smooth: true,
  };

  return (
    <div>
      <h2>广告统计</h2>
      
      {/* 统计卡片 */}
      <Spin spinning={loadingSummary}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="账户余额"
                value={summaryData ? parseFloat(summaryData.balance) : 0}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日消耗"
                value={summaryData ? parseFloat(summaryData.todaySpend) : 0}
                precision={2}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CalendarOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本周消耗"
                value={summaryData ? parseFloat(summaryData.weekSpend) : 0}
                precision={2}
                valueStyle={{ color: '#1677ff' }}
                prefix={<LineChartOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="最近7天消耗"
                value={summaryData ? parseFloat(summaryData.last7DaysSpend) : 0}
                precision={2}
                valueStyle={{ color: '#722ed1' }}
                prefix={<BarChartOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
      
      {/* 筛选器 */}
      <Card title="消耗明细" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleFilterSubmit}
          style={{ marginBottom: 24 }}
        >
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item name="platform" label="消耗平台">
            <Select
              style={{ width: 120 }}
              allowClear
              options={[
                { value: 'iOS', label: 'iOS' },
                { value: 'Android', label: 'Android' },
                { value: 'WeChat', label: 'WeChat' },
              ]}
              showSearch
              filterOption={(input, option) =>
                (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="adId" label="广告">
            <Select
              style={{ width: 150 }}
              allowClear
              options={adOptions}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
        
        {/* 图表 */}
        <div style={{ height: 300, marginBottom: 24 }}>
          {loadingDetails ? (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Spin />
            </div>
          ) : detailData.length > 0 ? (
            <Line {...chartConfig} />
          ) : (
            <Empty description="暂无数据" />
          )}
        </div>
        
        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={detailData}
          rowKey="date"
          loading={loadingDetails}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
