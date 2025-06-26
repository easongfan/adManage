import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 检查是否已存在管理员账户
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (!existingAdmin) {
    // 创建默认管理员账户
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        username: adminUsername,
        password_hash: passwordHash,
        role: 'admin',
      }
    });
    
    console.log(`默认管理员账户已创建: ${adminUsername}`);
  } else {
    console.log(`管理员账户已存在: ${adminUsername}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
