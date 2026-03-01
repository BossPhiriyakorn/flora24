import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId, type ArticleCategoryDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   PUT    /api/admin/article-categories/[id]  — แก้ไขชื่อ/สถานะ
   DELETE /api/admin/article-categories/[id]  — ลบ (ห้ามลบถ้ามีบทความในหมวดนี้)
──────────────────────────────────────────────────────────── */

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const status = body.status === 'inactive' ? 'inactive' : 'active';

    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
    if (!name) return NextResponse.json({ error: 'กรุณากรอกชื่อหมวดหมู่' }, { status: 400 });

    const db = await connectDB();
    const col = db.collection<ArticleCategoryDoc>('article_categories');
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });

    const dup = await col.findOne({
      _id: { $ne: new ObjectId(id) },
      name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    });
    if (dup) return NextResponse.json({ error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' }, { status: 409 });

    await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, status, updatedAt: new Date() } }
    );

    // อัปเดตบทความที่ใช้หมวดหมู่เดิมให้เป็นชื่อใหม่
    if (existing.name !== name) {
      await db.collection('articles').updateMany(
        { category: existing.name },
        { $set: { category: name, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[PUT /api/admin/article-categories/[id]]', err);
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
    const cat = await db.collection<ArticleCategoryDoc>('article_categories').findOne({ _id: new ObjectId(id) });
    if (!cat) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });

    const articleCount = await db.collection('articles').countDocuments({ category: cat.name });
    if (articleCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ มีบทความในหมวดหมู่นี้ ${articleCount} รายการ` },
        { status: 400 }
      );
    }

    const result = await db.collection('article_categories').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/admin/article-categories/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
