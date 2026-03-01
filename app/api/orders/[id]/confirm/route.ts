import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireUser, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   PATCH /api/orders/[id]/confirm
   ผู้ใช้กด "ได้รับสินค้าแล้ว" → orderStatus = 'delivered'
──────────────────────────────────────────────────────────── */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });

    const db = await connectDB();

    // ตรวจว่าเป็นออเดอร์ของผู้ใช้คนนี้ และอยู่ในสถานะ 'shipping' เท่านั้น
    const order = await db.collection('orders').findOne({
      _id:    new ObjectId(id),
      userId: new ObjectId(auth.sub),
    });
    if (!order) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    if (order.orderStatus !== 'shipping') {
      return NextResponse.json({ error: 'ไม่สามารถยืนยันได้ในขณะนี้' }, { status: 400 });
    }

    await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          orderStatus:  'delivered',
          confirmedAt:  new Date(),
          updatedAt:    new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PATCH /api/orders/[id]/confirm]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
