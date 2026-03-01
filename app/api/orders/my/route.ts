import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireUser, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET /api/orders/my
   รายการคำสั่งซื้อของผู้ใช้ที่ล็อคอินอยู่
   ใช้ใน: หน้า /track (ติดตามสินค้า)
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db     = await connectDB();
    const orders = await db
      .collection('orders')
      .find({ userId: new ObjectId(auth.sub) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, orders });
  } catch (err: any) {
    console.error('[GET /api/orders/my]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
