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
      .sort((a, b) => b.totalQty - a.totalQty);

    // ดึง products ที่ยังมีอยู่ในระบบ — สินค้าที่ถูกลบแล้วจะไม่โผล่ในอันดับ
    const validIds = list.map((x) => x.productId).filter((id) => id && ObjectId.isValid(id)) as string[];
    type ProductProjection = { _id: ObjectId; name?: string; imageUrl?: string };
    let productById = new Map<string, ProductProjection>();
    if (validIds.length > 0) {
      const products = await db
        .collection('products')
        .find({ _id: { $in: validIds.map((id) => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, imageUrl: 1 })
        .toArray() as ProductProjection[];
      productById = new Map(products.map((p) => [p._id.toString(), p]));
    }

    // กรองเฉพาะสินค้าที่ยังมีใน collection products (สินค้าที่ลบแล้วจะหายจากรายการ)
    list = list
      .filter((row) => row.productId && ObjectId.isValid(row.productId) && productById.has(row.productId))
      .slice(0, TOP)
      .map((row) => {
        const prod = row.productId ? productById.get(row.productId) : undefined;
        const name = prod?.name ?? row.name ?? 'ไม่ระบุชื่อ';
        const imageUrl = row.imageUrl ?? (prod?.imageUrl);
        return { ...row, name, imageUrl };
      });

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
