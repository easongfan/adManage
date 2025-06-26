import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// 创建广告消耗记录
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { ad_id, customer_id, amount, platform, spend_date } = body;

    // 验证必填字段
    if (!ad_id || !customer_id || !amount || !platform || !spend_date) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证金额为正数
    if (amount <= 0) {
      return NextResponse.json({ error: '消耗金额必须大于0' }, { status: 400 });
    }

    // 验证客户存在
    const customer = await prisma.user.findUnique({
      where: { id: customer_id, role: 'customer' },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 验证广告存在
    const ad = await prisma.ad.findFirst({
      where: { id: ad_id, customer_id },
    });

    if (!ad) {
      return NextResponse.json({ error: '广告不存在' }, { status: 404 });
    }

    // 验证客户余额充足
    const customerBalance = parseFloat(customer.balance || '0');
    if (customerBalance < amount) {
      return NextResponse.json({ error: '客户余额不足' }, { status: 400 });
    }

    // 在事务中原子地扣减余额并创建消耗记录
    const result = await prisma.$transaction(async (prismaClient) => {
      // 扣减客户余额
      const updatedCustomer = await prismaClient.user.update({
        where: { id: customer_id },
        data: {
          balance: customerBalance - amount,
        },
      });

      // 创建消耗记录
      const spendLog = await prismaClient.adSpendLog.create({
        data: {
          amount: amount,
          platform,
          spend_date: new Date(spend_date),
          ad: {
            connect: { id: ad_id }
          },
          creator: {
            connect: { id: authUser.id } // 关联到当前登录的管理员
          }
        },
      });

      return { updatedCustomer, spendLog };
    });

    return NextResponse.json({
      message: '广告消耗记录创建成功',
      spendLog: result.spendLog,
    });
  } catch (error: any) {
    console.error('创建广告消耗记录失败:', error);
    return NextResponse.json(
      { error: '创建广告消耗记录失败: ' + error.message },
      { status: 500 }
    );
  }
}
