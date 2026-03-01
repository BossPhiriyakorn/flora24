import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId, type ProductDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse, toSlug, parsePagination } from '@/lib/api-helpers';
import { createAdminNotification } from '@/lib/adminNotifications';

/* ────────────────────────────────────────────────────────────
   GET  /api/admin/products?category=&search=&status=&page=&limit=
   POST /api/admin/products  — สร้างสินค้าใหม่
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const { skip, limit, page } = parsePagination(searchParams);
    const category  = searchParams.get('category');
    const search    = searchParams.get('search')?.trim();
    const status    = searchParams.get('status');

    const db     = await connectDB();
    const filter: Record<string, unknown> = {};
    if (category) filter.categoryName = category;
    if (status)   filter.status = status;
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // เรียงตามลำดับรายการ (order) เท่านั้น — ไม่เรียงตามหมวด
    const pipeline = [
      { $match: filter },
      { $addFields: { _sortOrder: { $ifNull: ['$order', 999999999] } } },
      { $sort: { _sortOrder: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _sortOrder: 0 } },
    ];
    const [products, total] = await Promise.all([
      db.collection('products').aggregate(pipeline).toArray(),
      db.collection('products').countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, products, total, page, limit });
  } catch (err: any) {
    console.error('[GET /api/admin/products]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const { name, description, price, categoryId, imageUrl, status = 'active', stock, tags } = body;

    if (!name?.trim() || !description?.trim() || !price || !categoryId) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: 'หมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
    }

    const db = await connectDB();

    // ดึงชื่อหมวดหมู่มา denormalize
    const category = await db.collection('categories').findOne({ _id: new ObjectId(categoryId) });
    if (!category) {
      return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
    }

    // ลำดับใหม่ = max(order)+1 (แสดงท้ายรายการ) — สินค้าเก่าไม่มี order จะเรียงด้วย createdAt
    const last = await db.collection('products').findOne(
      {},
      { sort: { order: -1 }, projection: { order: 1 } }
    );
    const nextOrder = (last?.order != null ? Number(last.order) + 1 : 0);

    const now: ProductDoc = {
      name:         name.trim(),
      description:  description.trim(),
      price:        Number(price),
      categoryId:   new ObjectId(categoryId),
      categoryName: category.name,
      imageUrl:     imageUrl ?? '',
      status:       status === 'hidden' ? 'hidden' : 'active',
      stock:        stock != null ? Number(stock) : undefined,
      tags:         Array.isArray(tags) ? tags : [],
      order:        nextOrder,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    };

    const result = await db.collection<ProductDoc>('products').insertOne(now);
    const productIdStr = result.insertedId!.toString();
    const adminName = [auth.firstName, auth.lastName].filter(Boolean).join(' ').trim() || auth.email || 'แอดมิน';
    await createAdminNotification(db, {
      type:      'new_product',
      title:     'เพิ่มสินค้า',
      body:      `${now.name} · ${now.categoryName}`,
      actorName: adminName,
      refType:   'product',
      refId:     productIdStr,
    });
    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/products]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
