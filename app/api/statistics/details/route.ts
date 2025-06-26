import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 强制 API 路由不使用缓存
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// 获取统计详情数据
export async function GET(request: NextRequest) {
  try {
    // 验证客户权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'customer') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = authUser.id;
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const platform = searchParams.get('platform');
    const adId = searchParams.get('adId') ? parseInt(searchParams.get('adId') || '0') : undefined;
    
    // 解析日期
    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    
    // 设置结束日期为当天的23:59:59
    endDate.setHours(23, 59, 59, 999);
    
    // 构建查询条件
    const whereCondition: any = {
      ad: {
        customer_id: userId
      },
      spend_date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // 添加可选过滤条件
    if (platform) {
      whereCondition.platform = platform;
    }
    
    if (adId) {
      whereCondition.ad_id = adId;
    }
    
    // 按日期分组查询消耗数据
    const spendByDate = await prisma.adSpendLog.groupBy({
      by: ['spend_date'],
      where: whereCondition,
      _sum: {
        amount: true
      },
      orderBy: {
        spend_date: 'asc'
      }
    });
    
    // 格式化结果
    const formattedResults = spendByDate.map(item => ({
      date: item.spend_date.toISOString().split('T')[0],
      amount: item._sum.amount?.toString() || '0'
    }));
    
    return NextResponse.json(formattedResults);
  } catch (error: any) {
    console.error('获取统计详情失败:', error);
    return NextResponse.json(
      { error: '获取统计详情失败: ' + error.message },
      { status: 500 }
    );
  }
}
