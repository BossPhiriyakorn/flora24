import { NextRequest, NextResponse } from 'next/server';
import { connectDB, type ArticleCategoryDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';
import { createAdminNotification } from '@/lib/adminNotifications';

/* ────────────────────────────────────────────────────────────
   GET  /api/admin/article-categories  — รายการหมวดหมู่บทความ (พร้อมจำนวนบทความ)
   POST /api/admin/article-categories  — สร้างหมวดหมู่ใหม่
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db = await connectDB();
    const categories = await db
      .collection<ArticleCategoryDoc>('article_categories')
      .find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await db.collection('articles').countDocuments({ category: cat.name });
        return { ...cat, articleCount: count };
      })
    );

    return NextResponse.json({ ok: true, categories: withCounts });
  } catch (err: unknown) {
    console.error('[GET /api/admin/article-categories]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { name, status } = await req.json();
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อหมวดหมู่' }, { status: 400 });
    }

    const db = await connectDB();
    const existing = await db.collection('article_categories').findOne({
      name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (existing) {
      return NextResponse.json({ error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' }, { status: 409 });
    }

    const doc: ArticleCategoryDoc = {
      name: trimmedName,
      status: status === 'inactive' ? 'inactive' : 'active',
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<ArticleCategoryDoc>('article_categories').insertOne(doc);
    const adminName = [auth.firstName, auth.lastName].filter(Boolean).join(' ').trim() || auth.email || 'แอดมิน';
    await createAdminNotification(db, {
      type:      'new_article_category',
      title:     'เพิ่มหมวดหมู่บทความ',
      body:      trimmedName,
      actorName: adminName,
      refId:     result.insertedId!.toString(),
    });
    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/admin/article-categories]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
