import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 强制 API 路由不使用缓存
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// 获取客户广告列表
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

    // 检查客户是否存在
    const customer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 获取客户广告列表
    const ads = await prisma.ad.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ ads });
  } catch (error: any) {
    console.error('获取广告列表错误:', error);
    return NextResponse.json(
      { error: '获取广告列表失败' },
      { status: 500 }
    );
  }
}

// 创建新广告
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

    // 检查客户是否存在
    const customer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 解析请求体
    const { name, status, unit_price, billing_type, ad_format, budget, platform } = await request.json();

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { error: '广告名称不能为空' },
        { status: 400 }
      );
    }

    // 创建广告
    const ad = await prisma.ad.create({
      data: {
        customer_id: customerId,
        name,
        status: status || 'paused',
        unit_price: unit_price ? parseFloat(unit_price) : null,
        billing_type,
        ad_format,
        budget: budget ? parseFloat(budget) : null,
        platform,
        created_at: new Date(),
      },
    });

    return NextResponse.json({ ad }, { status: 201 });
  } catch (error: any) {
    console.error('创建广告错误:', error);
    return NextResponse.json(
      { error: '创建广告失败' },
      { status: 500 }
    );
  }
}
