import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/** วันนี้เที่ยงคืน (เวลาเซิร์ฟเวอร์) สำหรับนับคำสั่งซื้อวันนี้ */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ────────────────────────────────────────────────────────────
   GET /api/admin/stats/dashboard
   สถิติสำหรับการ์ดหน้าแรก: คำสั่งซื้อวันนี้, รอชำระ, สินค้า, สมาชิก, บทความ
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db = await connectDB();
    const today = startOfToday();

    const [
      ordersToday,
      ordersPendingPayment,
      totalProducts,
      totalMembers,
      totalArticles,
    ] = await Promise.all([
      db.collection('orders').countDocuments({ createdAt: { $gte: today } }),
      db.collection('orders').countDocuments({ paymentStatus: 'pending' }),
      db.collection('products').countDocuments({}),
      db.collection('users').countDocuments({}),
      db.collection('articles').countDocuments({}),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        ordersToday,
        ordersPendingPayment,
        totalProducts,
        totalMembers,
        totalArticles,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/admin/stats/dashboard]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
