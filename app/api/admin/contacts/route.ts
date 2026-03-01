import { NextRequest, NextResponse } from 'next/server';
import { connectDB, type ContactDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET /api/admin/contacts   — ดึงข้อมูลติดต่อ
   PUT /api/admin/contacts   — อัปเดตข้อมูลติดต่อ
   (collection มีแค่ 1 document — upsert เสมอ)
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db      = await connectDB();
    const contact = await db.collection('contacts').findOne({});
    return NextResponse.json({ ok: true, contact: contact ?? {} });
  } catch (err: any) {
    console.error('[GET /api/admin/contacts]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { phone, email, lineId, facebook, tiktok } = await req.json();

    const db = await connectDB();
    await db.collection<ContactDoc>('contacts').updateOne(
      {},
      {
        $set: {
          phone:     phone?.trim()    ?? '',
          email:     email?.trim()    ?? '',
          lineId:    lineId?.trim()   ?? '',
          facebook:  facebook?.trim() ?? '',
          tiktok:    tiktok?.trim()   ?? '',
          updatedAt: new Date(),
        },
      },
      { upsert: true }   // สร้างใหม่ถ้ายังไม่มี
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/admin/contacts]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
