import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 强制 API 路由不使用缓存
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/customers - 获取客户列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('searchTerm') || '';

    // 构建查询条件
    const whereCondition: any = {
      role: 'customer',
    };

    // 如果有搜索词，添加搜索条件
    if (searchTerm) {
      whereCondition.username = {
        contains: searchTerm,
        mode: 'insensitive',
      };
    }

    // 查询客户列表
    const customers = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        username: true,
        role: true,
        balance: true,
        created_at: true,
        profile: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('获取客户列表错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST /api/admin/customers - 创建新客户
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 解析请求体
    const { username, password, ...profileData } = await request.json();

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 在事务中创建用户和客户资料
    const newUser = await prisma.$transaction(async (tx) => {
      // 创建用户
      const user = await tx.user.create({
        data: {
          username,
          password_hash: passwordHash,
          role: 'customer',
        },
      });

      // 创建客户资料
      await tx.customerProfile.create({
        data: {
          user_id: user.id,
          company_name: profileData.company_name,
          company_website: profileData.company_website,
          contact_person: profileData.contact_person,
          mobile_phone: profileData.mobile_phone,
          contact_qq: profileData.contact_qq,
        },
      });

      return user;
    });

    // 查询完整的用户信息（包含资料）
    const createdUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        username: true,
        role: true,
        balance: true,
        created_at: true,
        profile: true,
      },
    });

    return NextResponse.json(createdUser, { status: 201 });
  } catch (error) {
    console.error('创建客户错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
