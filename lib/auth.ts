import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();

// 创建一个密钥用于验证JWT
const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'fallback-secret-key-for-jwt-please-set-env-var'
);

// 从请求中获取认证用户信息
export async function getAuthUser(request: NextRequest) {
  try {
    // 从Cookie中获取token
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }

    // 验证token
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    if (!payload || !payload.userId) {
      return null;
    }

    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.userId) },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('认证错误:', error);
    return null;
  }
}
