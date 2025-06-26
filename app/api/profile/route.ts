import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取用户个人资料
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 获取用户资料，包括关联的CustomerProfile
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    if (!userData) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 构建返回的数据结构
    const profileData = {
      username: userData.username,
      company_name: userData.profile?.company_name || '',
      company_website: userData.profile?.company_website || '',
      contact_name: userData.profile?.contact_person || '',
      contact_phone: userData.profile?.mobile_phone || '',
      contact_qq: userData.profile?.contact_qq || ''
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('获取用户资料错误:', error);
    return NextResponse.json({ error: '获取用户资料失败' }, { status: 500 });
  }
}

// 更新用户个人资料
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const data = await req.json();

    // 验证请求数据
    if (!data.company_name || !data.contact_name || !data.contact_phone) {
      return NextResponse.json(
        { error: '公司名称、联系人、联系电话为必填项' }, 
        { status: 400 }
      );
    }

    // 手机号简单验证
    if (!/^1[3-9]\d{9}$/.test(data.contact_phone)) {
      return NextResponse.json(
        { error: '请输入有效的手机号码' },
        { status: 400 }
      );
    }

    // 更新或创建用户资料
    const updatedProfile = await prisma.customerProfile.upsert({
      where: { 
        user_id: user.id
      },
      update: {
        company_name: data.company_name,
        company_website: data.company_website || null,
        contact_person: data.contact_name,
        mobile_phone: data.contact_phone,
        contact_qq: data.contact_qq || null
      },
      create: {
        user_id: user.id,
        company_name: data.company_name,
        company_website: data.company_website || null,
        contact_person: data.contact_name,
        mobile_phone: data.contact_phone,
        contact_qq: data.contact_qq || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: '个人资料更新成功' 
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    return NextResponse.json({ error: '更新用户资料失败' }, { status: 500 });
  }
}
