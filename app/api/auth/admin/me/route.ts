import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE, verifyAdminToken } from '@/lib/auth';

/* ────────────────────────────────────────────────────────────
   GET /api/auth/admin/me  — ข้อมูลแอดมินที่ล็อกอินอยู่ (จาก JWT)
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE.admin)?.value;
    if (!token) {
      return NextResponse.json({ error: 'ไม่ได้ล็อกอิน' }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'เซสชันหมดอายุ' }, { status: 401 });
    }

    const roleLabel = payload.role === 'admin' ? 'แอดมิน' : 'บรรณาธิการ';
    return NextResponse.json({
      ok: true,
      user: {
        id:        payload.sub,
        email:     payload.email,
        firstName: payload.firstName,
        lastName:  payload.lastName,
        role:      payload.role,
        roleLabel,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/auth/admin/me]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
