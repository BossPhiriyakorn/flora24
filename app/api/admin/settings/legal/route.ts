import { NextRequest, NextResponse } from 'next/server';
import { connectDB, type SiteSettingsDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';
import { createAdminNotification } from '@/lib/adminNotifications';

export const dynamic = 'force-dynamic';

/** GET /api/admin/settings/legal — โหลดข้อกำหนด/นโยบาย สำหรับ CMS */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db = await connectDB();
    const doc = await db.collection<SiteSettingsDoc>('site_settings').findOne({});
    return NextResponse.json({
      ok: true,
      termsContent: doc?.termsContent ?? '',
      privacyContent: doc?.privacyContent ?? '',
    });
  } catch (err: unknown) {
    console.error('[GET /api/admin/settings/legal]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

/** PUT /api/admin/settings/legal — บันทึกข้อกำหนด/นโยบาย จาก CMS */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const termsContent = typeof body.termsContent === 'string' ? body.termsContent : '';
    const privacyContent = typeof body.privacyContent === 'string' ? body.privacyContent : '';

    const db = await connectDB();
    await db.collection<SiteSettingsDoc>('site_settings').updateOne(
      {},
      {
        $set: {
          termsContent,
          privacyContent,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const adminName = [auth.firstName, auth.lastName].filter(Boolean).join(' ').trim() || auth.email || 'แอดมิน';
    await createAdminNotification(db, {
      type:      'settings_updated',
      title:     'ปรับการตั้งค่า',
      body:      'ข้อกำหนดและนโยบายความเป็นส่วนตัว',
      actorName: adminName,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[PUT /api/admin/settings/legal]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
