import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';
import { createAdminNotification } from '@/lib/adminNotifications';

/* ────────────────────────────────────────────────────────────
   GET   /api/admin/orders/[id]   — ดูรายละเอียดออเดอร์
   PATCH /api/admin/orders/[id]   — อัปเดตสถานะ / ข้อมูลการจัดส่ง / ยกเลิก

   PATCH body รูปแบบ:
   { action: 'prepare' }                          → pending → preparing
   { action: 'ship', shippingInfo: {...} }         → preparing → shipping
   { action: 'verify_payment' }                    → paymentStatus: verified
   { action: 'cancel', cancelReason: '...' }       → cancelled
──────────────────────────────────────────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });

    const db    = await connectDB();
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    if (!order) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    console.error('[GET /api/admin/orders/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });

    const body   = await req.json();
    const { action, shippingInfo, cancelReason } = body;

    const db    = await connectDB();
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    if (!order) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });

    let update: Record<string, unknown> = { updatedAt: new Date() };

    if (action === 'prepare') {
      if (order.orderStatus !== 'pending') {
        return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
      }
      update.orderStatus = 'preparing';

    } else if (action === 'ship') {
      if (order.orderStatus !== 'preparing') {
        return NextResponse.json({ error: 'ต้องเตรียมจัดส่งก่อน' }, { status: 400 });
      }
      if (!shippingInfo) {
        return NextResponse.json({ error: 'กรุณากรอกข้อมูลการจัดส่ง' }, { status: 400 });
      }
      update.orderStatus  = 'shipping';
      update.shippingInfo = { ...shippingInfo, shippedAt: new Date() };

    } else if (action === 'verify_payment') {
      update.paymentStatus = 'verified';

    } else if (action === 'cancel') {
      if (order.orderStatus === 'delivered') {
        return NextResponse.json({ error: 'ไม่สามารถยกเลิกออเดอร์ที่จัดส่งสำเร็จแล้ว' }, { status: 400 });
      }
      update.orderStatus  = 'cancelled';
      update.cancelReason = cancelReason?.trim() ?? 'ยกเลิกโดยแอดมิน';

    } else {
      return NextResponse.json({ error: `action '${action}' ไม่ถูกต้อง` }, { status: 400 });
    }

    await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (action === 'cancel' && order.orderId) {
      const adminName = [auth.firstName, auth.lastName].filter(Boolean).join(' ').trim() || auth.email || 'แอดมิน';
      await createAdminNotification(db, {
        type:      'order_cancelled',
        title:     'ยกเลิกคำสั่งซื้อ',
        body:      `${order.orderId} · ฿${order.total?.toLocaleString('th-TH') ?? ''}`,
        actorName: adminName,
        refType:   'order',
        refId:     order.orderId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PATCH /api/admin/orders/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
