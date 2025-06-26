import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 强制 API 路由不使用缓存
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';

const prisma = new PrismaClient();

// 创建一个密钥用于签名JWT
const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'fallback-secret-key-for-jwt-please-set-env-var'
);

export async function POST(request: Request) {
  try {
    // 解析请求体
    const { username, password } = await request.json();

    // 验证请求参数
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password_hash: true,
        role: true,
        balance: true,
      },
    });

    // 如果用户不存在
    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 创建JWT
    const token = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secretKey);

    // 创建响应
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        balance: user.balance,
      },
    });

    // 设置HttpOnly Cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24小时
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
