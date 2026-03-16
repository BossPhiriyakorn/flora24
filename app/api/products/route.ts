import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/products?category=&search=&page=&limit=&sortPrice=&priceMin=&priceMax=
   รายการสินค้าที่ status=active (public — ใช้ใน store homepage)
   sortPrice: 'asc' | 'desc' = เรียงราคาต่ำไปสูง / สูงไปต่ำ
   priceMin, priceMax: ช่วงราคา (ตัวเลข)
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category  = searchParams.get('category');
    const search    = searchParams.get('search')?.trim();
    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
    const limit     = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
    const sortPrice = (searchParams.get('sortPrice') ?? '').toLowerCase();
    const priceMin  = searchParams.get('priceMin')?.trim();
    const priceMax  = searchParams.get('priceMax')?.trim();
    const skip      = (page - 1) * limit;

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
    const min = priceMin ? parseFloat(priceMin) : NaN;
    const max = priceMax ? parseFloat(priceMax) : NaN;
    if (!Number.isNaN(min) && min >= 0) {
      (filter as any).price = (filter as any).price ?? {};
      ((filter as any).price as any).$gte = min;
    }
    if (!Number.isNaN(max) && max >= 0) {
      (filter as any).price = (filter as any).price ?? {};
      ((filter as any).price as any).$lte = max;
    }

    const sortByPrice = sortPrice === 'asc' || sortPrice === 'desc';
    const priceSort   = sortByPrice ? (sortPrice === 'asc' ? 1 : -1) : null;

    // เรียงตาม order (น้อย = แสดงก่อน) หรือตามราคา ถ้ามี sortPrice
    const pipeline: any[] = [
      { $match: filter },
      { $addFields: { _sortOrder: { $ifNull: ['$order', 999999999] } } },
      {
        $sort: sortByPrice
          ? { price: priceSort!, _sortOrder: 1, createdAt: -1 }
          : { _sortOrder: 1, createdAt: -1 },
      },
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
