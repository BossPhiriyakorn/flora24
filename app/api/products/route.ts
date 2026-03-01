import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/products?category=&search=&page=&limit=
   รายการสินค้าที่ status=active (public — ใช้ใน store homepage)
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category');
    const search   = searchParams.get('search')?.trim();
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
    const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
    const skip     = (page - 1) * limit;

    const db       = await connectDB();
    const filter: Record<string, unknown> = { status: 'active' };

    if (category && category !== 'all') {
      filter.categoryName = category;
    }
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    // เรียงตาม order (น้อย = แสดงก่อน) สินค้าเก่าที่ไม่มี order ไปท้าย
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
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
