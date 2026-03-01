import { SignJWT, jwtVerify } from 'jose';

/* ────────────────────────────────────────────────────────────
   Cookie names — แยกกันอย่างเด็ดขาด
   - flora_user_token  : ผู้ใช้ทั่วไป (store)
   - flora_admin_token : แอดมิน/พนักงาน (CMS)
   
   แม้ JWT_SECRET จะเหมือนกัน แต่ payload.role ต่างกัน
   และ middleware ตรวจสอบ cookie คนละชื่อ → ไม่มีทางสลับกันได้
──────────────────────────────────────────────────────────── */
export const COOKIE = {
  user:  'flora_user_token',
  admin: 'flora_admin_token',
} as const;

/* ─── Payload Types ─── */

export interface UserPayload {
  sub: string;           // MongoDB _id ของ user
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  provider: 'email' | 'line';
  role: 'user';          // fixed — ใช้ตรวจสอบไม่ให้ใช้ token นี้เข้า admin
}

export interface AdminPayload {
  sub: string;           // MongoDB _id ของ staff
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'editor';
}

/* ─── Secret helpers ─── */

function userSecret(): Uint8Array {
  const key = process.env.JWT_SECRET;
  if (!key) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(key);
}

function adminSecret(): Uint8Array {
  // ใช้ secret คนละตัวกับ user → แม้นำ token ไปใช้ข้ามก็ invalid
  const key = process.env.JWT_ADMIN_SECRET ?? process.env.JWT_SECRET;
  if (!key) throw new Error('JWT_SECRET / JWT_ADMIN_SECRET is not set');
  return new TextEncoder().encode(`admin::${key}`);
}

/* ─── Sign tokens ─── */

export async function signUserToken(
  payload: Omit<UserPayload, 'role'>,
): Promise<string> {
  return new SignJWT({ ...payload, role: 'user' } satisfies UserPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? '7d')
    .sign(userSecret());
}

export async function signAdminToken(
  payload: AdminPayload,
): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(adminSecret());
}

/* ─── Verify tokens ─── */

export async function verifyUserToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, userSecret());
    // ตรวจ role — ป้องกัน admin token แอบเข้า user route
    if ((payload as any).role !== 'user') return null;
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, adminSecret());
    if (!['admin', 'editor'].includes((payload as any).role)) return null;
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

/* ─── Cookie options (server action / route handler) ─── */

export function userCookieOptions(maxAgeSec?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec ?? 7 * 24 * 60 * 60, // 7 วัน
  };
}

export function adminCookieOptions(maxAgeSec?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    // path: '/' เพื่อให้ส่ง cookie ไปกับ /api/admin/* ด้วย (ถ้า path: '/admin' จะไม่ส่งไป /api/admin/...)
    path: '/',
    maxAge: maxAgeSec ?? 12 * 60 * 60, // 12 ชั่วโมง
  };
}
