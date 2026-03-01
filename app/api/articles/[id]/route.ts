import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/articles/[id]
   บทความชิ้นเดียวพร้อมเนื้อหาเต็ม (public)
──────────────────────────────────────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });
    }

    const db      = await connectDB();
    const article = await db.collection('articles').findOne({
      _id:    new ObjectId(id),
      status: 'published',
    });

    if (!article) {
      return NextResponse.json({ error: 'ไม่พบบทความ' }, { status: 404 });
    }

    // Related articles — หมวดหมู่เดียวกัน ยกเว้นตัวเอง
    const related = await db
      .collection('articles')
      .find(
        { _id: { $ne: new ObjectId(id) }, category: article.category, status: 'published' },
        { projection: { longDescription: 0 } }
      )
      .sort({ date: -1 })
      .limit(3)
      .toArray();

    return NextResponse.json({ ok: true, article, related });
  } catch (err: any) {
    console.error('[GET /api/articles/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
