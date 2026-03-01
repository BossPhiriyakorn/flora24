import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireUser, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   DELETE /api/profile/cards/[id]  — ลบบัตร
   PATCH  /api/profile/cards/[id]  — ตั้งเป็น default
──────────────────────────────────────────────────────────── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบบัตร' }, { status: 404 });

    const db    = await connectDB();
    const result = await db.collection('saved_cards').deleteOne({
      _id:    new ObjectId(id),
      userId: new ObjectId(auth.sub),   // ป้องกันลบบัตรคนอื่น
    });

    if (result.deletedCount === 0) return NextResponse.json({ error: 'ไม่พบบัตร' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/profile/cards/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id }     = await params;
    const { action } = await req.json();

    if (action !== 'set_default') {
      return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบบัตร' }, { status: 404 });

    const db    = await connectDB();
    const cards = db.collection('saved_cards');

    // unset default ทุกบัตร แล้วค่อย set บัตรที่เลือก
    await cards.updateMany({ userId: new ObjectId(auth.sub) }, { $set: { isDefault: false } });
    const result = await cards.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(auth.sub) },
      { $set: { isDefault: true } }
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: 'ไม่พบบัตร' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PATCH /api/profile/cards/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
