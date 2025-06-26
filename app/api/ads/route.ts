import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// 获取当前客户的所有广告
export async function GET(request: NextRequest) {
  try {
    // 验证客户权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'customer') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = authUser.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取客户的所有广告
    const ads = await prisma.ad.findMany({
      where: {
        customer_id: userId
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // 为每个广告计算总消耗和今日消耗
    const adsWithSpendData = await Promise.all(ads.map(async (ad) => {
      // 计算总消耗
      const totalSpend = await prisma.adSpendLog.aggregate({
        where: {
          ad_id: ad.id
        },
        _sum: {
          amount: true
        }
      });

      // 计算今日消耗
      const todaySpend = await prisma.adSpendLog.aggregate({
        where: {
          ad_id: ad.id,
          spend_date: {
            gte: today
          }
        },
        _sum: {
          amount: true
        }
      });

      return {
        ...ad,
        totalSpend: totalSpend._sum.amount?.toString() || '0',
        todaySpend: todaySpend._sum.amount?.toString() || '0'
      };
    }));

    return NextResponse.json({ ads: adsWithSpendData });
  } catch (error: any) {
    console.error('获取广告列表失败:', error);
    return NextResponse.json(
      { error: '获取广告列表失败: ' + error.message },
      { status: 500 }
    );
  }
}
