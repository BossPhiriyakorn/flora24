import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, type StaffDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET  /api/admin/staff         — รายการพนักงานทั้งหมด
   POST /api/admin/staff         — เพิ่มพนักงานใหม่
   (เฉพาะ role=admin เท่านั้นที่จัดการพนักงานได้)
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db    = await connectDB();
    const staff = await db
      .collection('staff')
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ ok: true, staff });
  } catch (err: any) {
    console.error('[GET /api/admin/staff]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'เฉพาะแอดมินเท่านั้นที่เพิ่มพนักงานได้' }, { status: 403 });
  }

  try {
    const { firstName, lastName, nickname, email, password, role = 'editor' } = await req.json();

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
    }

    const db = await connectDB();

    // เช็ค email ซ้ำ
    const dup = await db.collection('staff').findOne({ email: email.toLowerCase().trim() });
    if (dup) return NextResponse.json({ error: 'อีเมลนี้ถูกใช้แล้ว' }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);

    const newStaff: StaffDoc = {
      firstName:    firstName.trim(),
      lastName:     lastName.trim(),
      nickname:     nickname?.trim() ?? '',
      email:        email.toLowerCase().trim(),
      passwordHash,
      role:         role === 'admin' ? 'admin' : 'editor',
      createdAt:    new Date(),
    };

    const result = await db.collection<StaffDoc>('staff').insertOne(newStaff);
    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/staff]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
