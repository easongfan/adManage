import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 强制 API 路由不使用缓存
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// 获取单个广告详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; adId: string } }
) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    const adId = parseInt(params.adId);

    if (isNaN(customerId) || isNaN(adId)) {
      return NextResponse.json({ error: '无效的ID参数' }, { status: 400 });
    }

    // 获取广告详情
    const ad = await prisma.ad.findFirst({
      where: {
        id: adId,
        customer_id: customerId,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: '广告不存在' }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (error: any) {
    console.error('获取广告详情错误:', error);
    return NextResponse.json(
      { error: '获取广告详情失败' },
      { status: 500 }
    );
  }
}

// 更新广告
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; adId: string } }
) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    const adId = parseInt(params.adId);

    if (isNaN(customerId) || isNaN(adId)) {
      return NextResponse.json({ error: '无效的ID参数' }, { status: 400 });
    }

    // 检查广告是否存在
    const existingAd = await prisma.ad.findFirst({
      where: {
        id: adId,
        customer_id: customerId,
      },
    });

    if (!existingAd) {
      return NextResponse.json({ error: '广告不存在' }, { status: 404 });
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

    // 更新广告
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        name,
        status: status || existingAd.status,
        unit_price: unit_price !== undefined ? parseFloat(unit_price) : existingAd.unit_price,
        billing_type: billing_type || existingAd.billing_type,
        ad_format: ad_format || existingAd.ad_format,
        budget: budget !== undefined ? parseFloat(budget) : existingAd.budget,
        platform: platform || existingAd.platform,
      },
    });

    return NextResponse.json({ ad: updatedAd });
  } catch (error: any) {
    console.error('更新广告错误:', error);
    return NextResponse.json(
      { error: '更新广告失败' },
      { status: 500 }
    );
  }
}

// 删除广告
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; adId: string } }
) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    const adId = parseInt(params.adId);

    if (isNaN(customerId) || isNaN(adId)) {
      return NextResponse.json({ error: '无效的ID参数' }, { status: 400 });
    }

    // 检查广告是否存在
    const existingAd = await prisma.ad.findFirst({
      where: {
        id: adId,
        customer_id: customerId,
      },
    });

    if (!existingAd) {
      return NextResponse.json({ error: '广告不存在' }, { status: 404 });
    }

    // 删除广告（会级联删除相关的消费记录）
    await prisma.ad.delete({
      where: { id: adId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除广告错误:', error);
    return NextResponse.json(
      { error: '删除广告失败' },
      { status: 500 }
    );
  }
}
