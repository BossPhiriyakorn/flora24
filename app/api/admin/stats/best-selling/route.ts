import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

const TOP = 10;

/* ────────────────────────────────────────────────────────────
   GET /api/admin/stats/best-selling
   อันดับสินค้าขายดี จาก orders ที่ชำระเงินแล้ว (paymentStatus: verified)
   นับจาก items ใน order รวม qty ตาม productId หรือ name
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db = await connectDB();
    const orders = await db
      .collection('orders')
      .find({ paymentStatus: 'verified' })
      .project({ items: 1 })
      .toArray();

    const byKey = new Map<string, { name: string; totalQty: number; imageUrl?: string; productId?: string }>();

    for (const order of orders) {
      const items = order.items ?? [];
      for (const item of items) {
        const key = item.productId ?? item.name ?? 'unknown';
        const existing = byKey.get(key);
        const qty = Number(item.qty ?? item.quantity) || 0;
        if (existing) {
          existing.totalQty += qty;
          if (!existing.imageUrl && item.imageUrl) existing.imageUrl = item.imageUrl;
        } else {
          byKey.set(key, {
            name:     item.name ?? 'ไม่ระบุชื่อ',
            totalQty: qty,
            imageUrl: item.imageUrl,
            productId: item.productId,
          });
        }
      }
    }

    let list = Array.from(byKey.entries())
      .map(([key, v]) => ({ key, ...v }))
      .filter((v) => v.totalQty > 0)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, TOP);

    // ดึงรูปจาก products ถ้ายังไม่มี imageUrl
    const validIds = list.map((x) => x.productId).filter((id) => id && ObjectId.isValid(id)) as string[];
    if (validIds.length > 0) {
      const products = await db
        .collection('products')
        .find({ _id: { $in: validIds.map((id) => new ObjectId(id)) } })
        .project({ _id: 1, imageUrl: 1 })
        .toArray();
      const imgById = new Map(products.map((p) => [p._id.toString(), p.imageUrl]));
      list = list.map((row) => ({
        ...row,
        imageUrl: row.imageUrl ?? (row.productId ? imgById.get(row.productId) : undefined),
      }));
    }

    const items = list.map(({ key, name, totalQty, imageUrl, productId }) => ({
      productId: productId || key,
      name,
      totalQty,
      imageUrl: imageUrl || undefined,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (err: unknown) {
    console.error('[GET /api/admin/stats/best-selling]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
