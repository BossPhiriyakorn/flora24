import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId, type ArticleDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse, parsePagination } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET  /api/admin/articles?status=&category=&search=&page=&limit=
   POST /api/admin/articles — สร้างบทความใหม่
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const { skip, limit, page } = parsePagination(searchParams);
    const status   = searchParams.get('status');
    const category = searchParams.get('category');
    const search   = searchParams.get('search')?.trim();

    const db     = await connectDB();
    const filter: Record<string, unknown> = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:            { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const [articles, total] = await Promise.all([
      db.collection('articles')
        .find(filter, { projection: { longDescription: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('articles').countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, articles, total, page, limit });
  } catch (err: any) {
    console.error('[GET /api/admin/articles]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const {
      title, category, date, status = 'draft',
      shortDescription, longDescription, youtubeVideo,
      featuredImageUrl, seoTitle, seoDescription, seoKeyword,
    } = body;

    if (!title?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อและหมวดหมู่บทความ' }, { status: 400 });
    }

    const article: ArticleDoc = {
      title:            title.trim(),
      category:         category.trim(),
      authorId:         new ObjectId(auth.sub),
      authorName:       `${auth.firstName} ${auth.lastName}`,
      date:             date ?? new Date().toISOString().slice(0, 10),
      status:           status === 'published' ? 'published' : 'draft',
      shortDescription: shortDescription?.trim() ?? '',
      longDescription:  longDescription ?? '',
      youtubeVideo:     youtubeVideo?.trim() ?? '',
      featuredImageUrl: featuredImageUrl ?? '',
      seoTitle:         seoTitle?.trim() ?? '',
      seoDescription:   seoDescription?.trim() ?? '',
      seoKeyword:       seoKeyword?.trim() ?? '',
      createdAt:        new Date(),
      updatedAt:        new Date(),
    };

    const db     = await connectDB();
    const result = await db.collection<ArticleDoc>('articles').insertOne(article);
    const { createAdminNotification } = await import('@/lib/adminNotifications');
    const articleIdStr = result.insertedId!.toString();
    await createAdminNotification(db, {
      type:      'new_article',
      title:     'เพิ่มบทความ',
      body:      article.title,
      actorName: article.authorName,
      refType:   'article',
      refId:     articleIdStr,
    });
    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/articles]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
