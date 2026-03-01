import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse, toSlug } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   PUT    /api/admin/categories/[id]  — แก้ไขชื่อหมวดหมู่
   DELETE /api/admin/categories/[id]  — ลบหมวดหมู่ (ถ้าไม่มีสินค้า)
──────────────────────────────────────────────────────────── */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id }  = await params;
    const { name } = await req.json();

    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
    if (!name?.trim())         return NextResponse.json({ error: 'กรุณากรอกชื่อหมวดหมู่' }, { status: 400 });

    const db = await connectDB();

    // เช็ค duplicate (ยกเว้นตัวเอง)
    const dup = await db.collection('categories').findOne({
      _id:  { $ne: new ObjectId(id) },
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (dup) return NextResponse.json({ error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' }, { status: 409 });

    const result = await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: name.trim(), slug: toSlug(name.trim()), updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });

    // อัปเดต categoryName ใน products ด้วย
    await db.collection('products').updateMany(
      { categoryId: new ObjectId(id) },
      { $set: { categoryName: name.trim(), updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/admin/categories/[id]]', err);
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
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });

    const db = await connectDB();

    // ห้ามลบถ้ายังมีสินค้าอยู่
    const productCount = await db.collection('products').countDocuments({ categoryId: new ObjectId(id) });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ มีสินค้า ${productCount} ชิ้นในหมวดหมู่นี้` },
        { status: 400 }
      );
    }

    const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/admin/categories/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
