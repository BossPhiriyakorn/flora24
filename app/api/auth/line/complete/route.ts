import { NextRequest, NextResponse } from 'next/server';
import { signUserToken, userCookieOptions, COOKIE } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { connectDB, type UserDoc } from '@/lib/mongodb';
import { createAdminNotification } from '@/lib/adminNotifications';

/* ────────────────────────────────────────────────────────────
   POST /api/auth/line/complete
   บันทึก LINE user ครั้งแรก + ออก JWT
   Body: { token (temp), firstName, lastName, nickname, email, agreedToTerms }
──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token: tempToken, firstName, lastName, nickname, email, phone, agreedToTerms } = body;

    if (!agreedToTerms) {
      return NextResponse.json({ error: 'กรุณายอมรับข้อกำหนดการใช้งาน' }, { status: 400 });
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อและนามสกุล' }, { status: 400 });
    }
    const normalizedPhone = typeof phone === 'string' ? phone.replace(/\D/g, '').slice(0, 10) : '';

    // ─── Verify temp token ───
    const secret = new TextEncoder().encode(
      `line_temp::${process.env.JWT_SECRET ?? 'dev_secret'}`
    );
    let lineData: any;
    try {
      const { payload } = await jwtVerify(tempToken, secret);
      lineData = payload;
    } catch {
      return NextResponse.json({ error: 'ลิงค์หมดอายุ กรุณาล็อคอินใหม่' }, { status: 401 });
    }

    const db    = await connectDB();
    const users = db.collection<UserDoc>('users');

    const normalizedEmail = email?.toLowerCase().trim() ?? '';

    // ─── ตรวจว่า email มีอยู่แล้ว → merge กับบัญชีเดิม ───
    if (normalizedEmail) {
      const dup = await users.findOne({ email: normalizedEmail });
      if (dup) {
        await users.updateOne(
          { _id: dup._id },
          {
            $set: {
              lineUserId:      lineData.lineUserId,
              lineDisplayName: lineData.displayName,
              linePictureUrl:  lineData.pictureUrl,
              provider:        'both',
            },
          }
        );
        const token = await signUserToken({
          sub:       dup._id!.toString(),
          email:     dup.email,
          firstName: dup.firstName,
          lastName:  dup.lastName,
          nickname:  dup.nickname,
          provider:  'line',
        });
        const res = NextResponse.json({ ok: true, merged: true });
        res.cookies.set(COOKIE.user, token, userCookieOptions());
        return res;
      }
    }

    // ─── ผู้ใช้ใหม่ → insert ───
    const result = await users.insertOne({
      firstName:       firstName.trim(),
      lastName:        lastName.trim(),
      nickname:        nickname?.trim() ?? '',
      email:           normalizedEmail,
      phone:           normalizedPhone || undefined,
      lineUserId:      lineData.lineUserId as string,
      lineDisplayName: lineData.displayName as string,
      linePictureUrl:  lineData.pictureUrl as string,
      provider:        'line',
      status:          'active',
      createdAt:       new Date(),
      updatedAt:       new Date(),
    });

    const userId = result.insertedId!.toString();
    const customerName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ').trim() || normalizedEmail || 'LINE';
    await createAdminNotification(db, {
      type:      'new_customer',
      title:     'ผู้ใช้สมัครใหม่',
      body:      normalizedEmail || 'สมัครด้วย LINE',
      actorName: customerName,
      refType:   'user',
      refId:     userId,
    });

    const token = await signUserToken({
      sub:       userId,
      email:     normalizedEmail,
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      nickname:  nickname?.trim() ?? '',
      provider:  'line',
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE.user, token, userCookieOptions());
    return res;
  } catch (err: any) {
    console.error('[line/complete]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
