import { NextRequest, NextResponse } from 'next/server';
import { connectDB, type StoreHeroDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

const DEFAULT_HERO = {
  heroTagline: 'Premium 24/7 Floral Service',
  heroTitleLine1: 'BLOOMING',
  heroTitleLine2: 'EVERY SECOND.',
  heroDescLine1: 'สัมผัสความงามที่ไม่เคยหลับใหล จัดส่งดอกไม้ด่วนทั่วกรุงเทพฯ ตลอด 24 ชั่วโมง',
  heroDescLine2: 'เริ่มต้น 990 บาท จัดส่งฟรีภายใน 2 ชม.',
};

/* ────────────────────────────────────────────────────────────
   GET /api/admin/store-hero   — ดึงข้อความ Hero สำหรับแก้ไขใน CMS
   PUT /api/admin/store-hero   — บันทึกข้อความ Hero
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db = await connectDB();
    const doc = await db.collection('store_hero').findOne({});
    if (!doc) {
      return NextResponse.json({ ok: true, hero: DEFAULT_HERO });
    }
    const hero = {
      heroTagline: doc.heroTagline ?? DEFAULT_HERO.heroTagline,
      heroTitleLine1: doc.heroTitleLine1 ?? DEFAULT_HERO.heroTitleLine1,
      heroTitleLine2: doc.heroTitleLine2 ?? DEFAULT_HERO.heroTitleLine2,
      heroDescLine1: doc.heroDescLine1 ?? DEFAULT_HERO.heroDescLine1,
      heroDescLine2: doc.heroDescLine2 ?? DEFAULT_HERO.heroDescLine2,
    };
    return NextResponse.json({ ok: true, hero });
  } catch (err: any) {
    console.error('[GET /api/admin/store-hero]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const heroTagline = typeof body.heroTagline === 'string' ? body.heroTagline.trim() : DEFAULT_HERO.heroTagline;
    const heroTitleLine1 = typeof body.heroTitleLine1 === 'string' ? body.heroTitleLine1.trim() : DEFAULT_HERO.heroTitleLine1;
    const heroTitleLine2 = typeof body.heroTitleLine2 === 'string' ? body.heroTitleLine2.trim() : DEFAULT_HERO.heroTitleLine2;
    const heroDescLine1 = typeof body.heroDescLine1 === 'string' ? body.heroDescLine1.trim() : DEFAULT_HERO.heroDescLine1;
    const heroDescLine2 = typeof body.heroDescLine2 === 'string' ? body.heroDescLine2.trim() : DEFAULT_HERO.heroDescLine2;

    const db = await connectDB();
    await db.collection<StoreHeroDoc>('store_hero').updateOne(
      {},
      {
        $set: {
          heroTagline,
          heroTitleLine1,
          heroTitleLine2,
          heroDescLine1,
          heroDescLine2,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/admin/store-hero]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
