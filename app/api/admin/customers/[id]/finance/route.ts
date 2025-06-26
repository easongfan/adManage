import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/customers/[id]/finance - 获取客户财务记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: '无效的客户ID' }, { status: 400 });
    }

    // 查询客户信息
    const customer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
      select: {
        id: true,
        username: true,
        balance: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 查询财务交易记录
    const transactions = await prisma.financialTransaction.findMany({
      where: { customer_id: customerId },
      orderBy: { transaction_date: 'desc' },
    });

    return NextResponse.json({
      customer,
      transactions,
    });
  } catch (error) {
    console.error('获取财务记录错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST /api/admin/customers/[id]/finance - 创建财务交易（充值或扣款）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: '无效的客户ID' }, { status: 400 });
    }

    // 解析请求体
    const { type, amount, description } = await request.json();

    // 验证必填字段
    if (!type || !['recharge', 'deduction'].includes(type)) {
      return NextResponse.json(
        { error: '无效的交易类型' },
        { status: 400 }
      );
    }

    // 验证金额
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json(
        { error: '无效的金额' },
        { status: 400 }
      );
    }

    // 检查客户是否存在
    const customer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 计算实际金额（充值为正数，扣款为负数）
    const actualAmount = type === 'recharge' ? amount : -amount;

    // 在事务中创建交易记录并更新余额
    const result = await prisma.$transaction(async (tx) => {
      // 创建交易记录
      const transaction = await tx.financialTransaction.create({
        data: {
          customer_id: customerId,
          amount: actualAmount,
          type: type,
          notes: description || (type === 'recharge' ? '管理员充值' : '管理员扣款'),
          transaction_date: new Date(),
        },
      });

      // 更新用户余额
      const currentBalance = Number(customer.balance || 0);
      const newBalance = currentBalance + actualAmount;

      const updatedUser = await tx.user.update({
        where: { id: customerId },
        data: { balance: newBalance },
        select: {
          id: true,
          username: true,
          balance: true,
        },
      });

      return {
        transaction,
        user: updatedUser,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('创建财务交易错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
