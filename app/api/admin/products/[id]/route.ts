import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET    /api/admin/products/[id]
   PUT    /api/admin/products/[id]  — แก้ไขสินค้า
   DELETE /api/admin/products/[id]  — ลบสินค้า
──────────────────────────────────────────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });

    const db      = await connectDB();
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    if (!product) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });

    return NextResponse.json({ ok: true, product });
  } catch (err: any) {
    console.error('[GET /api/admin/products/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });

    const body = await req.json();
    const { name, description, price, categoryId, imageUrl, status, stock, tags } = body;

    const db     = await connectDB();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (name?.trim())        update.name = name.trim();
    if (description?.trim()) update.description = description.trim();
    if (price != null)       update.price = Number(price);
    if (imageUrl != null)    update.imageUrl = imageUrl;
    if (stock  != null)      update.stock = Number(stock);
    if (tags   != null)      update.tags = Array.isArray(tags) ? tags : [];
    if (status)              update.status = status === 'hidden' ? 'hidden' : 'active';

    // อัปเดต categoryName ถ้า categoryId เปลี่ยน
    if (categoryId && ObjectId.isValid(categoryId)) {
      const category = await db.collection('categories').findOne({ _id: new ObjectId(categoryId) });
      if (!category) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
      update.categoryId   = new ObjectId(categoryId);
      update.categoryName = category.name;
    }

    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/admin/products/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });

    const db     = await connectDB();
    const result = await db.collection('products').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/admin/products/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
