import { NextRequest, NextResponse } from 'next/server';
import { connectDB, type CategoryDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse, toSlug } from '@/lib/api-helpers';
import { createAdminNotification } from '@/lib/adminNotifications';

/* ────────────────────────────────────────────────────────────
   GET  /api/admin/categories
   POST /api/admin/categories — สร้างหมวดหมู่ใหม่
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db         = await connectDB();
    const categories = await db
      .collection('categories')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    // เพิ่มจำนวนสินค้าต่อหมวดหมู่
    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await db.collection('products').countDocuments({ categoryId: cat._id });
        return { ...cat, productCount: count };
      })
    );

    return NextResponse.json({ ok: true, categories: withCounts });
  } catch (err: any) {
    console.error('[GET /api/admin/categories]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อหมวดหมู่' }, { status: 400 });
    }

    const db = await connectDB();

    // เช็ค duplicate
    const existing = await db.collection('categories').findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (existing) {
      return NextResponse.json({ error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' }, { status: 409 });
    }

    const now: CategoryDoc = {
      name:      name.trim(),
      slug:      toSlug(name.trim()),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<CategoryDoc>('categories').insertOne(now);
    const adminName = [auth.firstName, auth.lastName].filter(Boolean).join(' ').trim() || auth.email || 'แอดมิน';
    await createAdminNotification(db, {
      type:      'new_product_category',
      title:     'เพิ่มหมวดหมู่สินค้า',
      body:      name.trim(),
      actorName: adminName,
      refId:     result.insertedId!.toString(),
    });
    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/categories]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
