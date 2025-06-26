import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 修改密码API
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { newPassword } = await req.json();

    // 验证密码强度
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少需要6位' }, 
        { status: 400 }
      );
    }

    // 生成新的密码哈希
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新用户密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword }
    });

    return NextResponse.json({ 
      success: true, 
      message: '密码修改成功' 
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
  }
}
