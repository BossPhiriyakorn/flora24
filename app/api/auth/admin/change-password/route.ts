import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { connectDB, type StaffDoc } from '@/lib/mongodb';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';

/* ────────────────────────────────────────────────────────────
   PUT /api/auth/admin/change-password
   เปลี่ยนรหัสผ่านแอดมิน (ต้องส่งรหัสผ่านเดิม + รหัสผ่านใหม่)
   หลังเปลี่ยนสำเร็จจะยกเลิก mustChangePassword
──────────────────────────────────────────────────────────── */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const body = await req.json();
    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;

    if (typeof currentPassword !== 'string' || !currentPassword.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสผ่านปัจจุบัน' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
    }

    const db = await connectDB();
    const staffCol = db.collection<StaffDoc>('staff');
    const staff = await staffCol.findOne({ _id: new ObjectId(auth.sub) });
    if (!staff) {
      return NextResponse.json({ error: 'ไม่พบบัญชี' }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, staff.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await staffCol.updateOne(
      { _id: staff._id },
      {
        $set: {
          passwordHash: newHash,
          mustChangePassword: false,
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PUT /api/auth/admin/change-password]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
