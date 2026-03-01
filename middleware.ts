import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, verifyAdminToken, COOKIE, adminCookieOptions } from '@/lib/auth';

/* ────────────────────────────────────────────────────────────
   Middleware — Token Separation

   Admin routes  (/admin/*)       → ตรวจสอบ flora_admin_token เท่านั้น
   Protected store routes         → ตรวจสอบ flora_user_token เท่านั้น
   Public store routes            → ผ่านได้เลย

   ป้องกัน:
   ✅ user token เข้า admin route ไม่ได้
   ✅ admin token เข้า user route ไม่ได้ (ต้องล็อคอิน user ต่างหาก)
   ✅ token ที่ถูก tamper หรือหมดอายุ → redirect ทันที
──────────────────────────────────────────────────────────── */

// Admin routes ที่ต้อง auth — ทุกอย่างภายใต้ /admin ยกเว้น /admin/login
const ADMIN_PUBLIC = ['/admin/login'];

// Auth pages ที่ไม่ต้อง login (ข้ามการตรวจสอบ user token)
const AUTH_PAGES = ['/login', '/register', '/register/line'];

// Store routes ที่ต้อง login (ใช้ startsWith — ยกเว้น / ที่ตรวจแยก)
const USER_PROTECTED_PREFIX = ['/checkout', '/profile', '/track', '/articles'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ════════════ ADMIN ROUTES ════════════ */
  if (pathname.startsWith('/admin')) {
    if (ADMIN_PUBLIC.some(p => pathname.startsWith(p))) {
      const adminToken = req.cookies.get(COOKIE.admin)?.value;
      if (adminToken) {
        const adminPayload = await verifyAdminToken(adminToken);
        if (adminPayload) {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }
      return NextResponse.next();
    }

    const adminToken = req.cookies.get(COOKIE.admin)?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    const adminPayload = await verifyAdminToken(adminToken);
    if (!adminPayload) {
      const res = NextResponse.redirect(new URL('/admin/login?reason=expired', req.url));
      res.cookies.set(COOKIE.admin, '', { ...adminCookieOptions(0), maxAge: 0 });
      return res;
    }
    // Re-set cookie with path: '/' เพื่อให้เบราว์เซอร์ส่ง cookie ไปกับ /api/admin/* ด้วย
    // (กรณีผู้ใช้ยังมี cookie เก่าที่ path=/admin อยู่)
    const res = NextResponse.next();
    res.cookies.set(COOKIE.admin, adminToken, adminCookieOptions());
    return res;
  }

  /* ════════════ AUTH PAGES (login / register) ════════════ */
  // ถ้าล็อคอินอยู่แล้ว → redirect home
  if (AUTH_PAGES.includes(pathname)) {
    const userToken = req.cookies.get(COOKIE.user)?.value;
    if (userToken) {
      const userPayload = await verifyUserToken(userToken);
      if (userPayload) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    return NextResponse.next();
  }

  /* ════════════ STORE PROTECTED ROUTES ════════════ */
  // ตรวจสอบทั้ง home page (exact /) และ prefix routes อื่นๆ
  const isHomePage     = pathname === '/';
  const isProtectedPath = USER_PROTECTED_PREFIX.some(p => pathname.startsWith(p));

  if (isHomePage || isProtectedPath) {
    const userToken = req.cookies.get(COOKIE.user)?.value;
    if (!userToken) {
      const loginUrl = new URL('/login', req.url);
      // ไม่ส่ง redirect param สำหรับ home — หลัง login กลับ / อยู่แล้ว
      if (!isHomePage) loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userPayload = await verifyUserToken(userToken);
    if (!userPayload) {
      const loginUrl = new URL('/login', req.url);
      if (!isHomePage) loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'expired');
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(COOKIE.user);
      return res;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin
    '/admin/:path*',
    // Auth pages
    '/login',
    '/register',
    '/register/line',
    // Store protected
    '/',
    '/checkout/:path*',
    '/profile/:path*',
    '/track/:path*',
    '/articles/:path*',
    '/articles',
  ],
};
