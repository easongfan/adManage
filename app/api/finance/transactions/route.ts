import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 强制 API 路由不使用缓存
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// 获取客户的财务记录
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    
    // 获取财务记录总数
    const total = await prisma.financialTransaction.count({
      where: {
        customer_id: userId
      }
    });
    
    // 获取分页的财务记录
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        customer_id: userId
      },
      orderBy: {
        transaction_date: 'desc'
      },
      skip,
      take: pageSize
    });
    
    return NextResponse.json({
      transactions,
      pagination: {
        current: page,
        pageSize,
        total
      }
    });
  } catch (error: any) {
    console.error('获取财务记录失败:', error);
    return NextResponse.json(
      { error: '获取财务记录失败: ' + error.message },
      { status: 500 }
    );
  }
}
