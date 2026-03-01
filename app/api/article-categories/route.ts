import { NextResponse } from 'next/server';
import { connectDB, type ArticleCategoryDoc } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/article-categories  — รายการหมวดหมู่บทความ (สถานะ active เท่านั้น) สำหรับหน้า store
──────────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const db = await connectDB();
    const categories = await db
      .collection<ArticleCategoryDoc>('article_categories')
      .find({ status: 'active' })
      .sort({ sortOrder: 1, createdAt: 1 })
      .project({ name: 1 })
      .toArray();

    return NextResponse.json({ ok: true, categories: categories.map((c) => ({ _id: c._id, name: c.name })) });
  } catch (err: unknown) {
    console.error('[GET /api/article-categories]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
