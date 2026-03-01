import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, adminCookieOptions } from '@/lib/auth';

/* ────────────────────────────────────────────────────────────
   POST /api/auth/admin/logout
   ลบเฉพาะ flora_admin_token — ไม่กระทบ flora_user_token
──────────────────────────────────────────────────────────── */
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE.admin, '', {
    ...adminCookieOptions(0),
    maxAge: 0, // ลบทันที
  });
  return res;
}
