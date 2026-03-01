import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signUserToken, userCookieOptions, COOKIE } from '@/lib/auth';
import { connectDB, type UserDoc } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const db    = await connectDB();
    const users = db.collection<UserDoc>('users');

    // ─── หา user จาก email ───
    const user = await users.findOne({
      email:    email.toLowerCase().trim(),
      provider: { $in: ['email', 'both'] },
    });

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบบัญชีนี้ หรือบัญชีนี้ล็อคอินด้วย LINE' }, { status: 401 });
    }

    // ─── ตรวจรหัสผ่าน ───
    const passwordMatch = await bcrypt.compare(password, user.passwordHash ?? '');
    if (!passwordMatch) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const userId = user._id!.toString();

    const token = await signUserToken({
      sub:       userId,
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName,
      nickname:  user.nickname,
      provider:  'email',
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id:        userId,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        nickname:  user.nickname,
      },
    });
    res.cookies.set(COOKIE.user, token, userCookieOptions());
    return res;
  } catch (err: any) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
