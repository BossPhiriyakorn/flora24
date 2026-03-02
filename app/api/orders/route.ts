import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId, type OrderDoc } from '@/lib/mongodb';
import { requireUser, isNextResponse } from '@/lib/api-helpers';
import { createAdminNotification } from '@/lib/adminNotifications';

/* ────────────────────────────────────────────────────────────
   POST /api/orders
   สร้างคำสั่งซื้อใหม่หลังชำระเงินสำเร็จ
   Body: { items, address, mapsLink, addressMode, note,
           paymentMethod, stripePaymentIntentId, stripePaymentMethodId,
           subtotal, deliveryFee, total }
──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const {
      items, address, mapsLink, addressMode, note,
      paymentMethod, stripePaymentIntentId, stripePaymentMethodId,
      subtotal, deliveryFee, total,
    } = body;

    if (!items?.length || !address?.trim() || !paymentMethod || !total) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const db    = await connectDB();
    const users = db.collection('users');

    // แปลง paymentMethod ให้ตรง schema (qr | credit_card)
    const normalizedPaymentMethod = paymentMethod === 'promptpay' || paymentMethod === 'qr' ? 'qr' : 'credit_card';

    // QR/PromptPay: ถ้าส่ง stripePaymentIntentId มา = ชำระผ่าน Stripe แล้ว → ตั้ง verified
    const paymentStatus = stripePaymentIntentId ? 'verified' as const : 'pending';

    // ดึงข้อมูล user มา denormalize
    const user = await users.findOne({ _id: new ObjectId(auth.sub) });
    if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });

    const orderId = `ORD-${Date.now()}`;

    // ปกติ items ส่ง quantity มา — ใส่ qty ด้วยเพื่อให้แอดมิน (ที่ใช้ item.qty) แสดงจำนวนได้
    const normalizedItems = items.map((i: any) => {
      const qty = Math.max(1, Number(i.quantity ?? i.qty) || 1);
      return { ...i, quantity: qty, qty };
    });

    const order: OrderDoc = {
      orderId,
      userId:           new ObjectId(auth.sub),
      customerName:     `${user.firstName} ${user.lastName}`,
      customerPhone:    user.phone ?? '',
      customerEmail:    user.email,
      items:            normalizedItems,
      subtotal:         Number(subtotal),
      deliveryFee:      Number(deliveryFee ?? 0),
      total:            Number(total),
      address:          address.trim(),
      mapsLink:         mapsLink?.trim() ?? undefined,
      addressMode:      addressMode ?? 'address_only',
      note:             note?.trim() ?? undefined,
      paymentMethod:    normalizedPaymentMethod,
      paymentStatus,
      stripePaymentIntentId:  stripePaymentIntentId ?? undefined,
      stripePaymentMethodId:  stripePaymentMethodId ?? undefined,
      orderStatus:      'pending',
      createdAt:        new Date(),
      updatedAt:        new Date(),
    };

    const result = await db.collection<OrderDoc>('orders').insertOne(order);

    const notifType = normalizedPaymentMethod === 'qr' && paymentStatus === 'pending'
      ? 'payment_pending'
      : 'new_order';
    const notifTitle = notifType === 'payment_pending'
      ? '💳 รอตรวจสอบสลิป'
      : '🛒 คำสั่งซื้อใหม่';
    await createAdminNotification(db, {
      type:      notifType,
      title:     notifType === 'payment_pending' ? 'รอตรวจสอบสลิป' : 'คำสั่งซื้อใหม่',
      body:      `${orderId} · ฿${order.total.toLocaleString('th-TH')}`,
      actorName: order.customerName,
      refType:   'order',
      refId:     orderId,
    });

    return NextResponse.json({ ok: true, orderId, id: result.insertedId }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
