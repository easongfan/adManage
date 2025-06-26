import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 强制 API 路由不使用缓存
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// 获取统计摘要数据
export async function GET(request: NextRequest) {
  try {
    // 验证客户权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'customer') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = authUser.id;
    
    // 根据中国时区计算当天日期（UTC+8）
    const chinaOffset = 8 * 60 * 60 * 1000; // 中国时区UTC+8
    const nowUTC = new Date();
    const nowChina = new Date(nowUTC.getTime() + chinaOffset);
    const todayStr = nowChina.toISOString().split('T')[0]; // 格式YYYY-MM-DD
    
    console.log('当前时间（中国时区）:', nowChina.toISOString());
    console.log('今天日期:', todayStr);
    
    // 如果数据库使用UTC存储日期，需要将时间转换为UTC
    const today = new Date(todayStr + 'T00:00:00.000Z');
    console.log('今日查询起始时间:', today.toISOString());
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // 本周开始（周日）
    
    const last7DaysStart = new Date(today);
    last7DaysStart.setDate(today.getDate() - 6); // 最近7天开始
    
    // 获取用户余额
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    // 计算今日消耗
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todaySpend = await prisma.adSpendLog.aggregate({
      where: {
        ad: {
          customer_id: userId
        },
        spend_date: {
          gte: today,
          lt: tomorrow // 添加上限，仅计算今天的数据
        }
      },
      _sum: {
        amount: true
      }
    });

    // 计算本周消耗
    const weekSpend = await prisma.adSpendLog.aggregate({
      where: {
        ad: {
          customer_id: userId
        },
        spend_date: {
          gte: weekStart
        }
      },
      _sum: {
        amount: true
      }
    });

    // 计算最近7天消耗
    const last7DaysSpend = await prisma.adSpendLog.aggregate({
      where: {
        ad: {
          customer_id: userId
        },
        spend_date: {
          gte: last7DaysStart
        }
      },
      _sum: {
        amount: true
      }
    });

    return NextResponse.json({
      balance: user?.balance || '0',
      todaySpend: todaySpend._sum.amount?.toString() || '0',
      weekSpend: weekSpend._sum.amount?.toString() || '0',
      last7DaysSpend: last7DaysSpend._sum.amount?.toString() || '0'
    });
  } catch (error: any) {
    console.error('获取统计摘要失败:', error);
    return NextResponse.json(
      { error: '获取统计摘要失败: ' + error.message },
      { status: 500 }
    );
  }
}
