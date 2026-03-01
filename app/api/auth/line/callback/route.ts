import { NextRequest, NextResponse } from 'next/server';
import { signUserToken, userCookieOptions, COOKIE } from '@/lib/auth';
import { connectDB, type UserDoc } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/auth/line/callback
   LINE OAuth callback — แลก code → access_token → user profile
   (ตอบ 307 เพื่อ redirect ไป / หรือ /register/line — ตามปกติของ OAuth)

   Flow:
   1. Verify state (CSRF)
   2. แลก code → token
   3. ดึง LINE profile
   4. เช็ค DB ว่าเคย register หรือยัง
      ✅ มีแล้ว → ออก JWT → redirect /
      ❌ ใหม่   → redirect /register/line?token=temp_token
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const baseUrl      = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const appUrl       = baseUrl;
  const clientId     = process.env.LINE_CLIENT_ID;
  const clientSecret = process.env.LINE_CLIENT_SECRET;
  const redirectUri  = `${appUrl}/api/auth/line/callback`;

  const { searchParams } = req.nextUrl;
  const code       = searchParams.get('code');
  const state      = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(new URL('/login?reason=line_denied', appUrl));
  }
  if (!code) {
    return NextResponse.redirect(new URL('/login?reason=line_failed', appUrl));
  }

  // ─── CSRF check ───
  const savedState = req.cookies.get('line_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/login?reason=state_mismatch', appUrl));
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?reason=not_configured', appUrl));
  }

  try {
    // ─── 1. แลก code → access_token ───
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[line/callback] token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/login?reason=line_failed', appUrl));
    }

    // ─── 2. ดึง LINE profile ───
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // ─── 3. ดึง email จาก id_token (ถ้ามี) ───
    let lineEmail = '';
    if (tokenData.id_token) {
      try {
        const [, payload] = tokenData.id_token.split('.');
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        lineEmail = decoded.email ?? '';
      } catch { /* ignore */ }
    }

    // ─── 4. เช็ค DB ───
    const db    = await connectDB();
    const users = db.collection<UserDoc>('users');

    const existingUser = await users.findOne({ lineUserId: profile.userId });

    if (existingUser) {
      // ผู้ใช้เคยลงทะเบียนแล้ว → อัปเดต LINE info แล้วออก JWT ทันที
      await users.updateOne(
        { _id: existingUser._id },
        { $set: { lineDisplayName: profile.displayName, linePictureUrl: profile.pictureUrl } }
      );
      const token = await signUserToken({
        sub:       existingUser._id!.toString(),
        email:     existingUser.email,
        firstName: existingUser.firstName,
        lastName:  existingUser.lastName,
        nickname:  existingUser.nickname,
        provider:  'line',
      });
      const res = NextResponse.redirect(new URL('/', appUrl));
      res.cookies.set(COOKIE.user, token, userCookieOptions());
      res.cookies.delete('line_oauth_state');
      return res;
    }

    // ─── ผู้ใช้ใหม่ → สร้าง temp token แล้ว redirect ไปกรอกข้อมูล ───
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(
      `line_temp::${process.env.JWT_SECRET ?? 'dev_secret'}`
    );
    const tempToken = await new SignJWT({
      lineUserId:  profile.userId,
      displayName: profile.displayName ?? '',
      pictureUrl:  profile.pictureUrl ?? '',
      email:       lineEmail,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(secret);

    const registerUrl = new URL('/register/line', appUrl);
    registerUrl.searchParams.set('token', tempToken);

    const res = NextResponse.redirect(registerUrl);
    res.cookies.delete('line_oauth_state');
    return res;
  } catch (err: any) {
    console.error('[line/callback]', err);
    return NextResponse.redirect(new URL('/login?reason=line_failed', appUrl));
  }
}
