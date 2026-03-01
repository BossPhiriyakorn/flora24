import { NextRequest, NextResponse } from 'next/server';

/* ────────────────────────────────────────────────────────────
   GET /api/auth/line
   Redirect ผู้ใช้ไปยัง LINE Login authorization endpoint
   (ตอบ 307 Temporary Redirect ตามปกติของ OAuth — ไม่ใช่ error)
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const clientId = process.env.LINE_CLIENT_ID;
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!clientId) {
    return NextResponse.json(
      { error: 'LINE_CLIENT_ID is not configured' },
      { status: 503 }
    );
  }

  const state        = crypto.randomUUID(); // CSRF protection
  const redirectUri  = `${appUrl}/api/auth/line/callback`;
  const scope        = 'profile openid email';
  const nonce        = crypto.randomUUID();

  const lineUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  lineUrl.searchParams.set('response_type', 'code');
  lineUrl.searchParams.set('client_id', clientId);
  lineUrl.searchParams.set('redirect_uri', redirectUri);
  lineUrl.searchParams.set('state', state);
  lineUrl.searchParams.set('scope', scope);
  lineUrl.searchParams.set('nonce', nonce);

  const res = NextResponse.redirect(lineUrl.toString());
  // บันทึก state ใน cookie เพื่อ verify ที่ callback
  res.cookies.set('line_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 นาที
  });
  return res;
}
