import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/contacts
   ข้อมูลติดต่อสำหรับแสดงใน store (public)
──────────────────────────────────────────────────────────── */
export async function GET() {
  try {
    const db      = await connectDB();
    const contact = await db.collection('contacts').findOne({});

    // ถ้ายังไม่มีข้อมูล ส่งค่า default กลับไป
    if (!contact) {
      return NextResponse.json({
        ok: true,
        contact: { phone: '', email: '', lineId: '', facebook: '', tiktok: '' },
      });
    }

    // ส่งเฉพาะ field ที่ไม่ว่าง (ไม่แสดง channel ที่ไม่ได้ใส่ข้อมูล)
    return NextResponse.json({ ok: true, contact });
  } catch (err: any) {
    console.error('[GET /api/contacts]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
