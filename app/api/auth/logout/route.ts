import { NextRequest, NextResponse } from 'next/server';
import { COOKIE } from '@/lib/auth';

/* ────────────────────────────────────────────────────────────
   POST /api/auth/logout
   ลบเฉพาะ flora_user_token — ไม่กระทบ flora_admin_token
──────────────────────────────────────────────────────────── */
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE.user, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // ลบทันที
  });
  return res;
}
