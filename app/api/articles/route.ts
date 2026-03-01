import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/articles?category=&limit=
   รายการบทความที่ status=published (public — ใช้ใน store)
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category');
    const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));

    const db     = await connectDB();
    const filter: Record<string, unknown> = { status: 'published' };
    if (category) filter.category = category;

    const articles = await db
      .collection('articles')
      .find(filter, {
        projection: {
          // ไม่ส่ง longDescription มาใน list (ข้อมูลเยอะเกินไป)
          longDescription: 0,
          seoTitle: 0, seoDescription: 0, seoKeyword: 0,
        },
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ ok: true, articles });
  } catch (err: any) {
    console.error('[GET /api/articles]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
