import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireUser, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET  /api/cart — ดึงตะกร้าของ user (sync ข้ามอุปกรณ์)
   PUT  /api/cart — อัปเดตตะกร้า (body: { items: CartItem[] })
──────────────────────────────────────────────────────────── */

function normalizeItem(item: any) {
  return {
    id: item?.id?.toString?.() ?? item?.id,
    name: item?.name ?? '',
    price: Number(item?.price) || 0,
    image: item?.image ?? '',
    quantity: Math.max(1, Math.min(99, Number(item?.quantity) || 1)),
    categoryName: item?.categoryName ?? '',
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db = await connectDB();
    const doc = await db.collection('carts').findOne({ userId: new ObjectId(auth.sub) });
    const items = Array.isArray(doc?.items) ? doc.items.map(normalizeItem) : [];
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error('[GET /api/cart]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const raw = body?.items;
    const items = Array.isArray(raw) ? raw.map(normalizeItem) : [];

    const db = await connectDB();
    await db.collection('carts').updateOne(
      { userId: new ObjectId(auth.sub) },
      { $set: { items, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error('[PUT /api/cart]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
