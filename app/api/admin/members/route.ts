import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin, isNextResponse, parsePagination } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET /api/admin/members?search=&status=&page=&limit=
   รายการสมาชิกทั้งหมด — Admin CMS
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const { skip, limit, page } = parsePagination(searchParams);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');

    const db     = await connectDB();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { phone:     { $regex: search, $options: 'i' } },
      ];
    }

    const [members, total] = await Promise.all([
      db.collection('users')
        .find(filter, { projection: { passwordHash: 0, lineUserId: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('users').countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, members, total, page, limit });
  } catch (err: any) {
    console.error('[GET /api/admin/members]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
