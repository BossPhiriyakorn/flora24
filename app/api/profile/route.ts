import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireUser, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET /api/profile   — ดึงข้อมูลโปรไฟล์ผู้ใช้ที่ล็อคอิน
   PUT /api/profile   — อัปเดตโปรไฟล์ (ชื่อ, ชื่อเล่น, เบอร์)
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db   = await connectDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(auth.sub) },
      { projection: { passwordHash: 0 } }   // ไม่ส่ง hash กลับ
    );

    if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    console.error('[GET /api/profile]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { firstName, lastName, nickname, phone } = await req.json();

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (firstName?.trim()) update.firstName = firstName.trim();
    if (lastName?.trim())  update.lastName  = lastName.trim();
    if (nickname != null)  update.nickname  = nickname.trim();
    if (phone    != null)  update.phone     = phone.trim();

    const db = await connectDB();
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.sub) },
      { $set: update }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/profile]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
