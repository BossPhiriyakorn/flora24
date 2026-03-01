import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, ObjectId } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   GET    /api/admin/staff/[id]  — รายละเอียดพนักงาน
   PUT    /api/admin/staff/[id]  — แก้ไขข้อมูลพนักงาน
   DELETE /api/admin/staff/[id]  — ลบพนักงาน (เฉพาะ admin)
──────────────────────────────────────────────────────────── */

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    const db = await connectDB();
    const staff = await db
      .collection('staff')
      .findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });

    if (!staff) return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 });
    return NextResponse.json({ ok: true, staff });
  } catch (err: any) {
    console.error('[GET /api/admin/staff/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    const { firstName, lastName, nickname, email, password, role } = await req.json();
    const db = await connectDB();

    const existing = await db.collection('staff').findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 });

    // ป้องกันการแก้ไข role เป็น admin โดย non-admin
    if (role === 'admin' && auth.role !== 'admin') {
      return NextResponse.json({ error: 'เฉพาะแอดมินเท่านั้นที่เปลี่ยน role เป็น admin ได้' }, { status: 403 });
    }

    // เช็ค email ซ้ำ (กรณีเปลี่ยน email)
    if (email && email.toLowerCase().trim() !== existing.email) {
      const dup = await db.collection('staff').findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: new ObjectId(id) },
      });
      if (dup) return NextResponse.json({ error: 'อีเมลนี้ถูกใช้แล้ว' }, { status: 409 });
    }

    const updates: Record<string, unknown> = {};
    if (firstName?.trim())   updates.firstName = firstName.trim();
    if (lastName?.trim())    updates.lastName  = lastName.trim();
    if (nickname !== undefined) updates.nickname = nickname?.trim() ?? '';
    if (email?.trim())       updates.email = email.toLowerCase().trim();
    if (role)                updates.role  = role === 'admin' ? 'admin' : 'editor';
    if (password && password.length >= 8) {
      updates.passwordHash = await bcrypt.hash(password, 12);
    }
    updates.updatedAt = new Date();

    await db.collection('staff').updateOne({ _id: new ObjectId(id) }, { $set: updates });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/admin/staff/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'เฉพาะแอดมินเท่านั้นที่ลบพนักงานได้' }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });
  }

  // ห้ามลบตัวเอง
  if (auth.sub === id) {
    return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 });
  }

  try {
    const db = await connectDB();
    const result = await db.collection('staff').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/admin/staff/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
