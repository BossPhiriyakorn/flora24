import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   PATCH /api/admin/products/reorder
   Body: { updates: [ { id: string, order: number } ] }
   ใช้ปรับลำดับแสดงในหน้าร้าน (น้อย = แสดงก่อน)
──────────────────────────────────────────────────────────── */

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const updates = body.updates;
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'กรุณาส่ง updates เป็น array ของ { id, order }' }, { status: 400 });
    }
    if (updates.length > 2) {
      return NextResponse.json({ error: 'แต่ละครั้งให้ส่งได้ไม่เกิน 2 รายการ' }, { status: 400 });
    }

    const db = await connectDB();
    const now = new Date();

    for (const u of updates) {
      const id = u.id;
      const order = typeof u.order === 'number' ? u.order : Number(u.order);
      if (!id || !ObjectId.isValid(id) || Number.isNaN(order)) continue;
      await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { $set: { order, updatedAt: now } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[PATCH /api/admin/products/reorder]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
