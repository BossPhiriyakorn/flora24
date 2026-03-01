import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET   /api/admin/members/[id]  — ดูรายละเอียดสมาชิก
                                    (พร้อมประวัติการซื้อ + บัตรที่ผูกไว้)
   PATCH /api/admin/members/[id]  — เปลี่ยนสถานะสมาชิก (active/suspended)
──────────────────────────────────────────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบสมาชิก' }, { status: 404 });

    const db = await connectDB();

    const [user, orders, cards] = await Promise.all([
      db.collection('users').findOne(
        { _id: new ObjectId(id) },
        { projection: { passwordHash: 0, lineUserId: 0 } }
      ),
      db.collection('orders')
        .find({ userId: new ObjectId(id) })
        .sort({ createdAt: -1 })
        .toArray(),
      db.collection('saved_cards')
        .find({ userId: new ObjectId(id) })
        .sort({ isDefault: -1 })
        .toArray(),
    ]);

    if (!user) return NextResponse.json({ error: 'ไม่พบสมาชิก' }, { status: 404 });

    return NextResponse.json({ ok: true, user, orders, cards });
  } catch (err: any) {
    console.error('[GET /api/admin/members/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'เฉพาะแอดมินเท่านั้น' }, { status: 403 });
  }

  try {
    const { id }     = await params;
    const { status } = await req.json();

    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบสมาชิก' }, { status: 404 });
    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'status ไม่ถูกต้อง' }, { status: 400 });
    }

    const db     = await connectDB();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: 'ไม่พบสมาชิก' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PATCH /api/admin/members/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
