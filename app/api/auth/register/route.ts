import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, type UserDoc, type PendingRegistrationDoc } from '@/lib/mongodb';
import { sendOtpEmail } from '@/lib/sendEmail';
import crypto from 'crypto';

const OTP_CODE_LENGTH = Math.max(4, Math.min(8, Number(process.env.OTP_CODE_LENGTH) || 6));
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;

function generateOtp(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < OTP_CODE_LENGTH; i++) {
    code += digits[crypto.randomInt(0, digits.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, nickname, email, password, confirmPassword, phone } = body;

    // ─── Validate ───
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }
    const normalizedPhone = typeof phone === 'string' ? phone.replace(/\D/g, '').slice(0, 10) : '';
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ตรงกัน' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
    }

    const db = await connectDB();
    const users = db.collection<UserDoc>('users');
    const pending = db.collection<PendingRegistrationDoc>('pending_registrations');

    const emailLower = email.toLowerCase().trim();

    // ─── ตรวจ email ซ้ำ ───
    const existing = await users.findOne({ email: emailLower });
    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้แล้ว' }, { status: 409 });
    }

    // ─── Hash password ───
    const passwordHash = await bcrypt.hash(password, 12);

    // ─── สร้าง OTP และเก็บ pending ───
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await pending.deleteMany({ email: emailLower });
    await pending.insertOne({
      email: emailLower,
      otpHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname?.trim() ?? '',
      phone: normalizedPhone || undefined,
      passwordHash,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      createdAt: now,
    });

    // ─── ส่ง OTP ทางอีเมล ───
    await sendOtpEmail(emailLower, otp);

    return NextResponse.json({
      ok: true,
      needVerify: true,
      message: 'กรุณาตรวจสอบอีเมลและกรอกรหัส OTP',
    });
  } catch (err: unknown) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
