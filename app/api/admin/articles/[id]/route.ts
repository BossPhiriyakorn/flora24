import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET    /api/admin/articles/[id]
   PUT    /api/admin/articles/[id]  — แก้ไขบทความ
   DELETE /api/admin/articles/[id]  — ลบบทความ
──────────────────────────────────────────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });

    const db      = await connectDB();
    const article = await db.collection('articles').findOne({ _id: new ObjectId(id) });
    if (!article) return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });

    return NextResponse.json({ ok: true, article });
  } catch (err: any) {
    console.error('[GET /api/admin/articles/[id]]', err);
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
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });

    const body   = await req.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    const fields = [
      'title', 'category', 'date', 'status',
      'shortDescription', 'longDescription', 'youtubeVideo',
      'featuredImageUrl', 'seoTitle', 'seoDescription', 'seoKeyword',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) update[f] = body[f];
    }
    // Normalize status
    if (update.status) {
      update.status = update.status === 'published' ? 'published' : 'draft';
    }

    const db     = await connectDB();
    const result = await db.collection('articles').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/admin/articles/[id]]', err);
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
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });

    const db     = await connectDB();
    const result = await db.collection('articles').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/admin/articles/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
