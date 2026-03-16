import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

const DEFAULT_HERO = {
  heroTagline: 'Premium 24/7 Floral Service',
  heroTitleLine1: 'BLOOMING',
  heroTitleLine2: 'EVERY SECOND.',
  heroDescLine1: 'สัมผัสความงามที่ไม่เคยหลับใหล จัดส่งดอกไม้ด่วนทั่วกรุงเทพฯ ตลอด 24 ชั่วโมง',
  heroDescLine2: 'เริ่มต้น 990 บาท จัดส่งฟรีภายใน 2 ชม.',
};

/* ────────────────────────────────────────────────────────────
   GET /api/store-hero
   ข้อความ Hero หน้าแอป (public — ใช้ใน store homepage)
──────────────────────────────────────────────────────────── */
export async function GET() {
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
    console.error('[GET /api/store-hero]', err);
    return NextResponse.json({ ok: true, hero: DEFAULT_HERO });
  }
}
