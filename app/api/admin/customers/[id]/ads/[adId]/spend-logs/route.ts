import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// 获取特定广告的消耗记录列表
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

    // 验证客户和广告是否存在
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "客户不存在" },
        { status: 404 }
      );
    }

    const ad = await prisma.ad.findUnique({
      where: { 
        id: adId,
        customer_id: customerId 
      },
    });

    if (!ad) {
      return NextResponse.json(
        { error: "广告不存在或不属于该客户" },
        { status: 404 }
      );
    }

    // 获取广告消耗记录
    const spendLogs = await prisma.adSpendLog.findMany({
      where: {
        ad_id: adId,
      },
      orderBy: {
        spend_date: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ spendLogs });
  } catch (error) {
    console.error("获取广告消耗记录失败:", error);
    return NextResponse.json(
      { error: "获取广告消耗记录失败" },
      { status: 500 }
    );
  }
}
