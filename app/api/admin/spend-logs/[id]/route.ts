import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// 删除广告消耗记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const spendLogId = parseInt(params.id);
    if (isNaN(spendLogId)) {
      return NextResponse.json({ error: '无效的消耗记录ID' }, { status: 400 });
    }

    // 查找消耗记录，并包含广告信息
    const spendLog = await prisma.adSpendLog.findUnique({
      where: { id: spendLogId },
      include: {
        ad: true
      }
    });

    if (!spendLog) {
      return NextResponse.json({ error: '消耗记录不存在' }, { status: 404 });
    }

    // 查找客户
    if (!spendLog || !spendLog.ad) {
      return NextResponse.json({ error: '消耗记录或相关广告不存在' }, { status: 404 });
    }
    
    const customerId = spendLog.ad.customer_id;
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 在事务中原子地返还余额并删除消耗记录
    const result = await prisma.$transaction(async (prismaClient) => {
      // 返还客户余额
      const currentBalance = parseFloat(customer.balance || '0');
      const spendAmount = parseFloat(spendLog.amount || '0');
      
      const updatedCustomer = await prismaClient.user.update({
        where: { id: customerId },
        data: {
          balance: (currentBalance + spendAmount).toString(),
        },
      });

      // 删除消耗记录
      const deletedSpendLog = await prismaClient.adSpendLog.delete({
        where: { id: spendLogId },
      });

      return { updatedCustomer, deletedSpendLog };
    });

    return NextResponse.json({
      message: '广告消耗记录删除成功',
      deletedSpendLog: result.deletedSpendLog,
    });
  } catch (error: any) {
    console.error('删除广告消耗记录失败:', error);
    return NextResponse.json(
      { error: '删除广告消耗记录失败: ' + error.message },
      { status: 500 }
    );
  }
}
