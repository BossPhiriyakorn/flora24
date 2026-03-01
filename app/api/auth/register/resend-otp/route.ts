import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDB, type PendingRegistrationDoc } from '@/lib/mongodb';
import { sendOtpEmail } from '@/lib/sendEmail';

const OTP_CODE_LENGTH = Math.max(4, Math.min(8, Number(process.env.OTP_CODE_LENGTH) || 6));
const OTP_COOLDOWN_MINUTES = Number(process.env.OTP_COOLDOWN_MINUTES) || 5;

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
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมล' }, { status: 400 });
    }

    const db = await connectDB();
    const pending = db.collection<PendingRegistrationDoc>('pending_registrations');
    const emailLower = email.toLowerCase().trim();

    const doc = await pending.findOne({ email: emailLower });
    if (!doc) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการสมัคร กรุณาสมัครใหม่' }, { status: 400 });
    }

    if (new Date() > doc.expiresAt) {
      await pending.deleteOne({ email: emailLower });
      return NextResponse.json({ error: 'รหัสหมดอายุ กรุณาสมัครใหม่' }, { status: 400 });
    }

    const now = new Date();
    const lastSent = doc.lastSentAt ? new Date(doc.lastSentAt) : null;
    const cooldownMs = OTP_COOLDOWN_MINUTES * 60 * 1000;
    if (lastSent && now.getTime() - lastSent.getTime() < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now.getTime() - lastSent.getTime())) / 1000);
      return NextResponse.json(
        { error: `กรุณารอ ${waitSec} วินาที ก่อนส่งรหัสอีกครั้ง` },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now.getTime() + (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000);

    await pending.updateOne(
      { email: emailLower },
      { $set: { otpHash, expiresAt, lastSentAt: now } }
    );

    await sendOtpEmail(emailLower, otp);

    return NextResponse.json({ ok: true, message: 'ส่งรหัส OTP ไปที่อีเมลแล้ว' });
  } catch (err: unknown) {
    console.error('[resend-otp]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
