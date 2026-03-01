import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, verifyAdminToken, COOKIE, UserPayload, AdminPayload } from './auth';

/* ─── ตรวจสอบ User Token ─── */
export async function requireUser(
  req: NextRequest
): Promise<UserPayload | NextResponse> {
  const token = req.cookies.get(COOKIE.user)?.value;
  if (!token) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  const payload = await verifyUserToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
  }
  return payload;
}

/* ─── ตรวจสอบ Admin Token ─── */
export async function requireAdmin(
  req: NextRequest
): Promise<AdminPayload | NextResponse> {
  const token = req.cookies.get(COOKIE.admin)?.value;
  if (!token) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
  }
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
  }
  return payload;
}

/* ─── Type guard ─── */
export function isNextResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}

/* ─── Slug generator ─── */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 60);
}

/* ─── Pagination helper ─── */
export function parsePagination(searchParams: URLSearchParams) {
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}
