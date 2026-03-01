import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin, isNextResponse, parsePagination } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET /api/admin/orders?status=&paymentStatus=&page=&limit=
   รายการคำสั่งซื้อทั้งหมด — Admin CMS
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const { skip, limit, page } = parsePagination(searchParams);
    const orderStatus   = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search        = searchParams.get('search')?.trim();

    const db     = await connectDB();
    const filter: Record<string, unknown> = {};

    if (orderStatus)   filter.orderStatus   = orderStatus;
    if (paymentStatus) filter.paymentStatus  = paymentStatus;
    if (search) {
      filter.$or = [
        { orderId:       { $regex: search, $options: 'i' } },
        { customerName:  { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.collection('orders').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('orders').countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, orders, total, page, limit });
  } catch (err: any) {
    console.error('[GET /api/admin/orders]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
