import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId, type AdminNotificationDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

const DEFAULT_LIMIT = 50;

/* ────────────────────────────────────────────────────────────
   GET  /api/admin/notifications  — รายการแจ้งเตือน (ล่าสุดก่อน)
   PATCH /api/admin/notifications — mark read (body: { id } หรือ { markAll: true })
   DELETE /api/admin/notifications — ลบทั้งหมด (clear all)
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 100);

    const db = await connectDB();
    const list = await db
      .collection<AdminNotificationDoc>('admin_notifications')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const notifications = list.map((n) => ({
      id:        n._id!.toString(),
      type:      n.type,
      title:     n.title,
      body:      n.body,
      actorName: n.actorName,
      refType:   n.refType,
      refId:     n.refId,
      read:      n.read,
      timestamp: n.createdAt.getTime(),
      orderId:   n.refType === 'order' ? n.refId : undefined,
    }));

    return NextResponse.json({ ok: true, notifications });
  } catch (err: unknown) {
    console.error('[GET /api/admin/notifications]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const { id, markAll } = body;

    const db = await connectDB();
    const col = db.collection<AdminNotificationDoc>('admin_notifications');

    if (markAll === true) {
      await col.updateMany({}, { $set: { read: true } });
      return NextResponse.json({ ok: true });
    }

    if (id && ObjectId.isValid(id)) {
      const result = await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { read: true } }
      );
      if (result.matchedCount === 0) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'กรุณาส่ง id หรือ markAll: true' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[PATCH /api/admin/notifications]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db = await connectDB();
    await db.collection('admin_notifications').deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/admin/notifications]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
