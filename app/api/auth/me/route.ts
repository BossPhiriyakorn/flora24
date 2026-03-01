import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, COOKIE } from '@/lib/auth';

/* ────────────────────────────────────────────────────────────
   GET /api/auth/me
   ตรวจสอบว่า user ล็อคอินอยู่หรือไม่
   ใช้สำหรับ client component ที่ต้องการแสดง/ซ่อนปุ่ม logout
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE.user)?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const payload = await verifyUserToken(token);
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({
    ok: true,
    user: {
      id:        payload.sub,
      email:     payload.email,
      firstName: payload.firstName,
      lastName:  payload.lastName,
      nickname:  payload.nickname,
      provider:  payload.provider,
    },
  });
}
