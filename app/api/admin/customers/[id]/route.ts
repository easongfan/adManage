import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/customers/[id] - 获取单个客户详情
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
        role: true,
        balance: true,
        created_at: true,
        profile: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('获取客户详情错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/customers/[id] - 更新客户信息
export async function PUT(
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
    const { password, ...profileData } = await request.json();

    // 检查客户是否存在
    const existingCustomer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 在事务中更新客户信息
    await prisma.$transaction(async (tx) => {
      // 如果提供了新密码，则更新密码
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        await tx.user.update({
          where: { id: customerId },
          data: { password_hash: passwordHash },
        });
      }

      // 更新客户资料
      await tx.customerProfile.update({
        where: { user_id: customerId },
        data: {
          company_name: profileData.company_name,
          company_website: profileData.company_website,
          contact_person: profileData.contact_person,
          mobile_phone: profileData.mobile_phone,
          contact_qq: profileData.contact_qq,
        },
      });
    });

    // 查询更新后的客户信息
    const updatedCustomer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        username: true,
        role: true,
        balance: true,
        created_at: true,
        profile: true,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('更新客户信息错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/customers/[id] - 删除客户
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

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: '无效的客户ID' }, { status: 400 });
    }

    // 检查客户是否存在
    const existingCustomer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 在事务中删除客户及相关数据
    await prisma.$transaction(async (tx) => {
      // 删除客户资料
      await tx.customerProfile.delete({
        where: { user_id: customerId },
      });

      // 删除客户账户
      await tx.user.delete({
        where: { id: customerId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除客户错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
