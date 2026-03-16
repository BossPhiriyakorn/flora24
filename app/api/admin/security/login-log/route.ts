import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET /api/admin/security/login-log
   รายการล็อกอินแอดมินล่าสุด (สำหรับ ตั้งค่า > ความปลอดภัย > บันทึกการเข้าใช้งาน)
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10));
    const db = await connectDB();
    const list = await db
      .collection('admin_login_log')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ ok: true, list });
  } catch (err: any) {
    console.error('[GET /api/admin/security/login-log]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
