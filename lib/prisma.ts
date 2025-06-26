import { PrismaClient } from '@prisma/client';

// 创建 PrismaClient 实例
const prisma = new PrismaClient();

// 导出 prisma 实例，以便在整个应用中使用
export default prisma;
