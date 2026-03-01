import { NextResponse } from 'next/server';
import { connectDB, type SiteSettingsDoc } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/legal — สาธารณะ
 * ดึงข้อกำหนดและนโยบายจากที่ตั้งค่าใน CMS (site_settings) เท่านั้น
 * ถ้ายังไม่มีข้อมูลใน DB จะคืนค่าว่าง — หน้าสมัครจะใช้ข้อความ fallback ของตัวเอง
 */
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const db = await connectDB();
    const doc = await db.collection<SiteSettingsDoc>('site_settings').findOne({});
    return NextResponse.json(
      {
        termsContent: doc?.termsContent ?? '',
        privacyContent: doc?.privacyContent ?? '',
      },
      { headers: NO_STORE }
    );
  } catch (err: unknown) {
    console.error('[GET /api/settings/legal]', err);
    return NextResponse.json({ termsContent: '', privacyContent: '' }, { headers: NO_STORE });
  }
}
