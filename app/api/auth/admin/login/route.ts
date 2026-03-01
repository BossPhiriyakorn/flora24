import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAdminToken, adminCookieOptions, COOKIE } from '@/lib/auth';
import { connectDB, type StaffDoc } from '@/lib/mongodb';
import { createAdminNotification } from '@/lib/adminNotifications';

/* ────────────────────────────────────────────────────────────
   POST /api/auth/admin/login
   ล็อคอิน CMS Admin → ออก flora_admin_token cookie (path=/ เพื่อส่งไป /api/admin/*)
──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const db    = await connectDB();
    const staff = db.collection<StaffDoc>('staff');

    const adminUser = await staff.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'ไม่พบบัญชีนี้' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, adminUser.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // อัปเดต lastLogin
    await staff.updateOne(
      { _id: adminUser._id },
      { $set: { lastLogin: new Date() } }
    );

    const userId = adminUser._id!.toString();

    const token = await signAdminToken({
      sub:       userId,
      email:     adminUser.email,
      firstName: adminUser.firstName,
      lastName:  adminUser.lastName,
      role:      adminUser.role,
    });

    const adminName = [adminUser.firstName, adminUser.lastName].filter(Boolean).join(' ').trim() || adminUser.email;
    await createAdminNotification(db, {
      type:      'admin_login',
      title:     'แอดมินเข้าสู่ระบบ',
      body:      adminUser.email,
      actorName: adminName,
      refType:   'staff',
      refId:     userId,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id:        userId,
        email:     adminUser.email,
        firstName: adminUser.firstName,
        lastName:  adminUser.lastName,
        role:      adminUser.role,
      },
    });
    res.cookies.set(COOKIE.admin, token, adminCookieOptions());
    return res;
  } catch (err: any) {
    console.error('[admin/login]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
