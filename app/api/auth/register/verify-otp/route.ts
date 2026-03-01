import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signUserToken, userCookieOptions, COOKIE } from '@/lib/auth';
import { connectDB, type UserDoc, type PendingRegistrationDoc } from '@/lib/mongodb';
import { createAdminNotification } from '@/lib/adminNotifications';

const MAX_OTP_ATTEMPTS = Math.max(1, Number(process.env.MAX_OTP_ATTEMPTS) || 5);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัส OTP' }, { status: 400 });
    }

    const db = await connectDB();
    const users = db.collection<UserDoc>('users');
    const pending = db.collection<PendingRegistrationDoc>('pending_registrations');

    const emailLower = email.toLowerCase().trim();
    const doc = await pending.findOne({ email: emailLower });

    if (!doc) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการสมัครหรือรหัสหมดอายุ กรุณาสมัครใหม่' }, { status: 400 });
    }

    if (new Date() > doc.expiresAt) {
      await pending.deleteOne({ email: emailLower });
      return NextResponse.json({ error: 'รหัส OTP หมดอายุ กรุณาสมัครใหม่' }, { status: 400 });
    }

    const attempts = (doc.attempts ?? 0) + 1;
    if (attempts > MAX_OTP_ATTEMPTS) {
      await pending.deleteOne({ email: emailLower });
      return NextResponse.json({ error: 'ใส่รหัสผิดเกินจำนวนที่กำหนด กรุณาสมัครใหม่' }, { status: 400 });
    }

    const ok = await bcrypt.compare(code.trim(), doc.otpHash);
    if (!ok) {
      await pending.updateOne({ email: emailLower }, { $set: { attempts } });
      return NextResponse.json({ error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 });
    }

    // ─── สร้าง user และลบ pending ───
    const result = await users.insertOne({
      firstName: doc.firstName,
      lastName: doc.lastName,
      nickname: doc.nickname,
      email: doc.email,
      passwordHash: doc.passwordHash,
      provider: 'email',
      status: 'active',
      createdAt: new Date(),
    });

    await pending.deleteOne({ email: emailLower });

    const userId = result.insertedId!.toString();
    const customerName = [doc.firstName, doc.lastName].filter(Boolean).join(' ').trim() || doc.email;
    await createAdminNotification(db, {
      type:      'new_customer',
      title:     'ผู้ใช้สมัครใหม่',
      body:      doc.email,
      actorName: customerName,
      refType:   'user',
      refId:     userId,
    });
    const token = await signUserToken({
      sub: userId,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      nickname: doc.nickname,
      provider: 'email',
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: doc.email,
        firstName: doc.firstName,
        lastName: doc.lastName,
        nickname: doc.nickname,
      },
    });
    res.cookies.set(COOKIE.user, token, userCookieOptions());
    return res;
  } catch (err: unknown) {
    console.error('[verify-otp]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
